"use client";

import type React from "react";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Youtube, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [useTimeFormat, setUseTimeFormat] = useState(false);

  const serverStatus = useQuery({
    ...trpc.video.status.queryOptions(),
    refetchInterval: 1000,
  });

  const trimVideo = useMutation(trpc.video.trim.mutationOptions());

  const secondsToTimeFormat = (seconds: number): string => {
    if (isNaN(seconds)) return "";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const timeFormatToSeconds = (timeFormat: string): number => {
    if (!timeFormat) return 0;
    const parts = timeFormat.split(":").map(Number);
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return (minutes ?? 0) * 60 + (seconds ?? 0);
    } else {
      return 0;
    }
  };

  const isValidTimeFormat = (time: string): boolean => {
    return /^(\d+:)?[0-5]?\d:[0-5]\d$/.test(time);
  };

  const isServerBusy = serverStatus.data?.isTrimming;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isServerBusy) return;

    setIsSubmitted(true);

    const startSeconds = useTimeFormat ? timeFormatToSeconds(startTime) : Number.parseFloat(startTime);
    const endSeconds = useTimeFormat ? timeFormatToSeconds(endTime) : Number.parseFloat(endTime);

    try {
      await trimVideo.mutateAsync({
        youtubeUrl,
        startTime: startSeconds,
        endTime: endSeconds,
      });
    } catch (error) {
      console.error("Error trimming video:", error);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setYoutubeUrl("");
    setStartTime("");
    setEndTime("");
  };

  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const isFormValid =
    youtubeUrl &&
    startTime &&
    endTime &&
    isValidYoutubeUrl(youtubeUrl) &&
    (useTimeFormat
      ? isValidTimeFormat(startTime) &&
        isValidTimeFormat(endTime) &&
        timeFormatToSeconds(endTime) > timeFormatToSeconds(startTime)
      : Number.parseFloat(startTime) >= 0 && Number.parseFloat(endTime) > Number.parseFloat(startTime));

  const handleFormatToggle = (checked: boolean) => {
    setUseTimeFormat(checked);
    if (checked) {
      if (startTime) setStartTime(secondsToTimeFormat(Number.parseFloat(startTime)));
      if (endTime) setEndTime(secondsToTimeFormat(Number.parseFloat(endTime)));
    } else {
      if (startTime) setStartTime(timeFormatToSeconds(startTime).toString());
      if (endTime) setEndTime(timeFormatToSeconds(endTime).toString());
    }
  };

  const isWaitingForServer = isServerBusy && !trimVideo.isPending && isSubmitted;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">YouTube Video Trimmer</h1>
          <ServerStatusIndicator isLoading={serverStatus.isLoading} isBusy={isServerBusy} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-6 w-6 text-red-500" />
                  Trim Settings
                </CardTitle>
                <CardDescription>
                  Enter a YouTube URL and specify the start and end times to trim the video.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtube-url">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        required
                      />
                      {youtubeUrl && !isValidYoutubeUrl(youtubeUrl) && (
                        <p className="text-sm text-red-500">Please enter a valid YouTube URL</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="time-format">Use time format (MM:SS or HH:MM:SS)</Label>
                        <Switch id="time-format" checked={useTimeFormat} onCheckedChange={handleFormatToggle} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-time">
                            {useTimeFormat ? "Start Time (MM:SS or HH:MM:SS)" : "Start Time (seconds)"}
                          </Label>
                          <Input
                            id="start-time"
                            type={useTimeFormat ? "text" : "number"}
                            min={useTimeFormat ? undefined : "0"}
                            step={useTimeFormat ? undefined : "0.1"}
                            placeholder={useTimeFormat ? "1:30 or 0:01:30" : "0"}
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                          />
                          {useTimeFormat && startTime && !isValidTimeFormat(startTime) && (
                            <p className="text-sm text-red-500">Invalid time format (use MM:SS or HH:MM:SS)</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time">
                            {useTimeFormat ? "End Time (MM:SS or HH:MM:SS)" : "End Time (seconds)"}
                          </Label>
                          <Input
                            id="end-time"
                            type={useTimeFormat ? "text" : "number"}
                            min={useTimeFormat ? undefined : "0"}
                            step={useTimeFormat ? undefined : "0.1"}
                            placeholder={useTimeFormat ? "2:45 or 0:02:45" : "60"}
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                          />
                          {useTimeFormat && endTime && !isValidTimeFormat(endTime) && (
                            <p className="text-sm text-red-500">Invalid time format (use MM:SS or HH:MM:SS)</p>
                          )}
                        </div>
                      </div>

                      {startTime &&
                        endTime &&
                        (useTimeFormat
                          ? isValidTimeFormat(startTime) &&
                            isValidTimeFormat(endTime) &&
                            timeFormatToSeconds(endTime) <= timeFormatToSeconds(startTime) && (
                              <p className="text-sm text-red-500">End time must be greater than start time</p>
                            )
                          : Number.parseFloat(endTime) <= Number.parseFloat(startTime) && (
                              <p className="text-sm text-red-500">End time must be greater than start time</p>
                            ))}
                    </div>

                    {isServerBusy && (
                      <Alert variant="destructive" className="bg-background">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>The server is currently processing another video.</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={!isFormValid && !isWaitingForServer}>
                      Trim Video
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {isWaitingForServer && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-amber-500" />
                        <p className="text-center text-sm text-amber-700">
                          Waiting for server availability...
                          <br />
                          Your request is queued and will process when the server is free.
                        </p>
                      </div>
                    )}

                    {trimVideo.isPending && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-500" />
                        <p className="text-sm text-gray-500">Processing your video. This may take a few minutes...</p>
                      </div>
                    )}

                    {trimVideo.isError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {trimVideo.error?.message ||
                            "An error occurred while processing your video. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {trimVideo.isSuccess && trimVideo.data && (
                      <div className="space-y-4">
                        <div className="flex max-w-md items-center gap-3 rounded-lg bg-gray-800 p-4 text-white">
                          <div className="flex-shrink-0 rounded-full bg-green-500 p-1">
                            <Check className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium">All done! Use the video player to download the video</p>
                        </div>

                        <Button variant="outline" onClick={resetForm} className="mt-4 w-full">
                          Trim Another Video
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
                <CardDescription>
                  {!trimVideo.data ? "Your trimmed video will appear here" : "Your trimmed video is ready to watch"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {!isSubmitted || isWaitingForServer || trimVideo.isPending ? (
                  <>
                    {serverStatus.data?.lastTrimmedVideoUrl ? (
                      <div className="w-full">
                        <div className="aspect-video overflow-hidden rounded-lg">
                          <iframe
                            src={serverStatus.data.lastTrimmedVideoUrl}
                            className="h-full w-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          ></iframe>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-lg">
                        <Youtube className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  </>
                ) : trimVideo.isError ? (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100">
                    <p className="text-gray-500">Error loading video</p>
                  </div>
                ) : trimVideo.data ? (
                  <div className="w-full">
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <iframe
                        src={trimVideo.data.videoUrl}
                        className="h-full w-full"
                        title={trimVideo.data.title}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function ServerStatusIndicator({ isLoading, isBusy }: { isLoading: boolean; isBusy: boolean | undefined }) {
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1 border-gray-500 bg-gray-700 text-gray-100 hover:bg-gray-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking status
      </Badge>
    );
  }

  if (isBusy) {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">
        Server Busy
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-emerald-400 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30">
      Server Available
    </Badge>
  );
}
