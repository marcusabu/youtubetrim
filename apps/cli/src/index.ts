#!/usr/bin/env node

import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

class Trimmer {
    youtubeUrl: string = '';
    cleanUrl: string = '';
    startTime: string = '';
    endTime: string = '';
    videoTitle: string = '';
    outputDir: string;

    constructor() {
        const desktopPath = path.join(os.homedir(), 'Desktop');
        this.outputDir = path.join(desktopPath, 'youtubetrim');
        fs.mkdirSync(this.outputDir, { recursive: true });
    }

    setYoutubeUrl(url: string) {
        this.youtubeUrl = url;
        this.cleanUrl = this.cleanYouTubeUrl(url);
    }

    setStartTime(time: string) {
        this.startTime = time;
    }

    setEndTime(time: string) {
        this.endTime = time;
    }

    cleanYouTubeUrl(url: string): string {
        const urlObj = new URL(url);
        let videoId: string | null = null;

        if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        }

        if (!videoId) {
            throw new Error('Could not extract video ID');
        }

        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    parseTime(timeStr: string): number {
        const parts = timeStr.split(':');

        if (parts.length === 1) {
            return parseInt(parts[0], 10);
        } else if (parts.length === 2) {
            const [m, s] = parts.map(Number);
            return m * 60 + s;
        } else if (parts.length === 3) {
            const [h, m, s] = parts.map(Number);
            return h * 3600 + m * 60 + s;
        } else {
            throw new Error(`Invalid time format: ${timeStr}`);
        }
    }

    async getVideoTitle() {
        const titleCmd = `yt-dlp --get-title "${this.cleanUrl}"`;
        const { stdout } = await execAsync(titleCmd);
        this.videoTitle = stdout.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    }

    async downloadAndTrim() {
        const startSeconds = this.parseTime(this.startTime);
        const endSeconds = this.parseTime(this.endTime);
        const duration = endSeconds - startSeconds;

        if (duration <= 0) {
            throw new Error('End time must be after start time');
        }

        console.log(`\n⏳ Getting video title...`);
        await this.getVideoTitle();
        console.log(`Title: ${this.videoTitle}`);

        const tempPath = path.join(this.outputDir, 'temp_source.mp4');
        console.log('⬇️  Downloading video...');
        await execAsync(`yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 "${this.cleanUrl}" -o "${tempPath}"`);

        const outputPath = path.join(this.outputDir, `${this.videoTitle}_trimmed.mp4`);
        console.log('✂️  Trimming video...');
        await execAsync(`ffmpeg -y -i "${tempPath}" -ss ${startSeconds} -t ${duration} -c copy "${outputPath}"`);

        fs.unlinkSync(tempPath);

        console.log(`✅ Done! Saved to: ${outputPath}`);

        // Ask user if they want to open the folder
        const { openFolder } = await inquirer.prompt({
            type: 'confirm',
            name: 'openFolder',
            message: 'Would you like to open the output folder?',
            default: true,
        });

        if (openFolder) {
            await execAsync(`open "${this.outputDir}"`);
            console.log('📁 Opened output folder');
        }
    }
}

(async () => {
    const trimmer = new Trimmer();

    // Initial prompts
    await trimmer.setYoutubeUrl((await inquirer.prompt({ type: 'input', name: 'url', message: 'YouTube URL:' })).url);
    trimmer.setStartTime((await inquirer.prompt({ type: 'input', name: 'start', message: 'Start time (SS, MM:SS, HH:MM:SS):' })).start);
    trimmer.setEndTime((await inquirer.prompt({ type: 'input', name: 'end', message: 'End time (SS, MM:SS, HH:MM:SS):' })).end);

    let done = false;
    while (!done) {
        console.log('\n📋 Current settings:');
        console.log(`YouTube URL: ${trimmer.youtubeUrl}`);
        console.log(`Clean URL: ${trimmer.cleanUrl}`);
        console.log(`Start Time: ${trimmer.startTime}`);
        console.log(`End Time: ${trimmer.endTime}`);

        const { edit } = await inquirer.prompt({
            type: 'confirm',
            name: 'edit',
            message: 'Do you want to edit anything?',
            default: false,
        });

        if (!edit) {
            done = true;
        } else {
            const { field } = await inquirer.prompt({
                type: 'list',
                name: 'field',
                message: 'Which field do you want to edit?',
                choices: ['YouTube URL', 'Start Time', 'End Time'],
            });

            if (field === 'YouTube URL') {
                const { url } = await inquirer.prompt({ type: 'input', name: 'url', message: 'New YouTube URL:' });
                trimmer.setYoutubeUrl(url);
            } else if (field === 'Start Time') {
                const { start } = await inquirer.prompt({ type: 'input', name: 'start', message: 'New Start Time:' });
                trimmer.setStartTime(start);
            } else if (field === 'End Time') {
                const { end } = await inquirer.prompt({ type: 'input', name: 'end', message: 'New End Time:' });
                trimmer.setEndTime(end);
            }
        }
    }

    await trimmer.downloadAndTrim();
})();