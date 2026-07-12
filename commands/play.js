const YTDlpWrap = require('yt-dlp-wrap').default;
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const binaryPath = path.join(__dirname, '../bin', binaryName);

const ytDlpWrap = new YTDlpWrap(binaryPath);

module.exports = {
    name: 'play',
    async execute(sock, sender, text, args) {
        let searchQuery = text.trim();
        if (searchQuery.startsWith('.play')) {
            searchQuery = searchQuery.replace('.play', '').trim();
        }

        if (!searchQuery) return await sock.sendMessage(sender, { text: '❌ Please provide a song name.' });

        try {
            await sock.sendMessage(sender, { text: '🎵 Fetching playable audio via standalone yt-dlp binary...' });

            const outputDirectory = path.join(__dirname, '../temp');
            if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory);
            
            // Fix: Changed extension to .m4a to ensure correct container formatting
            const outputFilePath = path.join(outputDirectory, `${Date.now()}.m4a`);

            // Fix: Target the 'm4a' audio format directly during extraction
            await ytDlpWrap.execPromise([
                `ytsearch1:${searchQuery}`, 
                '-x', 
                '--audio-format', 'm4a', 
                '--ffmpeg-location', ffmpeg.path,
                '-o', outputFilePath
            ]);

            if (fs.existsSync(outputFilePath)) {
                await sock.sendMessage(sender, {
                    audio: { url: outputFilePath },
                    mimetype: 'audio/mp4',
                    fileName: 'audio.mp4'
                });
                fs.unlinkSync(outputFilePath);
            } else {
                await sock.sendMessage(sender, { text: '❌ Audio download failed to generate.' });
            }

        } catch (error) {
            console.error('yt-dlp standalone execution error:', error);
            await sock.sendMessage(sender, { text: '❌ An error occurred during download processing.' });
        }
    }
};