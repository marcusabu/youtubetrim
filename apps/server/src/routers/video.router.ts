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

            isTrimming = true;

            const { youtubeUrl, startTime, endTime } = input;
            const duration = endTime - startTime;
            const outputDir = path.resolve("downloads");
            const outputFile = "trimmed.mp4";

            try {
                fs.mkdirSync(outputDir, { recursive: true });

                const tempPath = path.join(outputDir, "source.mp4");
                const outputPath = path.join(outputDir, "trimmed.mp4");

                // Delete old file if exists
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }

                // Download full video
                const downloadCmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 "${youtubeUrl}" -o "${tempPath}"`;
                await execAsync(downloadCmd);

                // Trim the result
                const ffmpegCmd = `ffmpeg -y -i "${tempPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`;
                await execAsync(ffmpegCmd);

                // Clean up
                fs.unlinkSync(tempPath);

                return {
                    title: "Trimmed Video",
                    videoUrl: `/downloads/${outputFile}`, // embed this in a <video />
                };
            } catch (error: any) {
                throw new Error(`Failed to trim video: ${error.message}`);
            } finally {
                isTrimming = false;
            }
        }),

    status: protectedProcedure.query(() => {
        const outputPath = path.resolve("downloads", "trimmed.mp4");
        const exists = fs.existsSync(outputPath);

        return {
            isTrimming,
            lastTrimmedVideoUrl: exists ? "/downloads/trimmed.mp4" : null,
        };
    }),
});