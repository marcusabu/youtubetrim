import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

let isTrimming = false;

export const videoRouter = router({
    trim: protectedProcedure
        .input(
            z.object({
                youtubeUrl: z.string().url(),
                startTime: z.number().min(0),
                endTime: z.number().min(0),
            }),
        )
        .mutation(async ({ input }) => {
            if (isTrimming) {
                throw new Error("A trimming operation is already in progress.");
            }

            const { youtubeUrl, startTime, endTime } = input;
            const outputDir = path.resolve("downloads");

            try {
                fs.mkdirSync(outputDir, { recursive: true });

                // Get video title first
                const titleCmd = `yt-dlp --get-title "${youtubeUrl}"`;
                console.log(`Executing command: ${titleCmd}`);
                const { stdout: titleOutput } = await execAsync(titleCmd);
                const videoTitle = titleOutput.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');

                // Set global state
                isTrimming = true;

                // Start background trimming process
                (async () => {
                    try {
                        // Delete old MP4 files in output directory (ignore tmp folder)
                        const files = fs.readdirSync(outputDir);
                        for (const file of files) {
                            if (file.endsWith('.mp4') && file !== 'tmp') {
                                const filePath = path.join(outputDir, file);
                                if (fs.statSync(filePath).isFile()) {
                                    fs.unlinkSync(filePath);
                                    console.log(`Deleted old file: ${file}`);
                                }
                            }
                        }

                        const tempPath = path.join(outputDir, "tmp", "source.mp4");
                        const outputFile = `${videoTitle}.mp4`;
                        const outputPath = path.join(outputDir, outputFile);

                        const downloadCmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 "${youtubeUrl}" -o "${tempPath}"`;
                        console.log(`Executing command: ${downloadCmd}`);
                        const { stdout: downloadOut, stderr: downloadErr } = await execAsync(downloadCmd);
                        console.log("yt-dlp stdout:", downloadOut);
                        console.log("yt-dlp stderr:", downloadErr);

                        const duration = endTime - startTime;
                        const ffmpegCmd = `ffmpeg -y -i "${tempPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`;
                        console.log(`Executing command: ${ffmpegCmd}`);
                        const { stdout: ffmpegOut, stderr: ffmpegErr } = await execAsync(ffmpegCmd);
                        console.log("ffmpeg stdout:", ffmpegOut);
                        console.log("ffmpeg stderr:", ffmpegErr);

                        fs.unlinkSync(tempPath);
                        console.log(`Background trimming completed for: ${videoTitle}`);
                    } catch (error: any) {
                        console.error("Error during background video trimming:", error);
                    } finally {
                        isTrimming = false;
                    }
                })();

                return {
                    videoTitle,
                };
            } catch (error: any) {
                console.error("Error starting video trimming:", error);
                isTrimming = false;
                throw new Error(`Failed to start video trimming: ${error.message}`);
            }
        }),

    status: protectedProcedure.query(() => {
        const outputDir = path.resolve("downloads");
        let videoUrl = null;

        if (fs.existsSync(outputDir)) {
            const files = fs.readdirSync(outputDir);
            const mp4Files = files.filter(file => file.endsWith('.mp4') && file !== 'tmp');
            if (mp4Files.length > 0) {
                videoUrl = `/downloads/${mp4Files[0]}`;
            }
        }

        return {
            isTrimming,
            videoUrl,
        };
    }),
});