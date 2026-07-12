const YTDlpWrap = require('yt-dlp-wrap').default;
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const binaryPath = path.join(__dirname, '../bin', binaryName);

module.exports = {
    name: 'play',
    async execute(sock, sender, text, args) {
        let searchQuery = text.trim();
        if (searchQuery.startsWith('.play')) {
            searchQuery = searchQuery.replace('.play', '').trim();
        }

        if (!searchQuery) return await sock.sendMessage(sender, { text: '❌ Please provide a song name.' });

        try {
            await sock.sendMessage(sender, { text: '🎵 Searching for your audio...' });

            // Search for the video first to get the URL and title cleanly
            const searchResult = await yts(searchQuery);
            const video = searchResult.videos[0];
            if (!video) return await sock.sendMessage(sender, { text: '❌ No results found.' });

            if (isWindows) {
                // LOCAL WINDOWS: Use the reliable local yt-dlp binary approach
                const outputDirectory = path.join(__dirname, '../temp');
                if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory);
                const outputFilePath = path.join(outputDirectory, `${Date.now()}.m4a`);

                const ytDlpWrap = new YTDlpWrap(binaryPath);
                await ytDlpWrap.execPromise([
                    video.url, 
                    '-x', 
                    '--audio-format', 'm4a', 
                    '--ffmpeg-location', ffmpeg.path,
                    '-o', outputFilePath
                ]);

                if (fs.existsSync(outputFilePath)) {
                    await sock.sendMessage(sender, {
                        audio: { url: outputFilePath },
                        mimetype: 'audio/mp4',
                        fileName: `${video.title}.mp4`
                    });
                    fs.unlinkSync(outputFilePath);
                } else {
                    throw new Error('Local file conversion failed');
                }
            } else {
                // LINUX PANEL: Bypass the server IP block completely using a direct external download mirror
                const downloadUrl = `https://api.vexdh.xyz/download/mp3?url=${encodeURIComponent(video.url)}`;
                
                await sock.sendMessage(sender, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mp4',
                    fileName: `${video.title}.mp4`
                });
            }

        } catch (error) {
            console.error('Play command error:', error);
            await sock.sendMessage(sender, { text: '❌ Failed to process the request.' });
        }
    }
};