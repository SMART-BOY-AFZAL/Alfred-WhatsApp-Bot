const ytMdl = require('yt-dlp-exec');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'play',
    async execute(sock, sender, text, args) {
        if (!args[0]) {
            return await sock.sendMessage(sender, { 
                text: '❌ Please provide a song name.\n*Example:* `.play Post Malone Sunflower`' 
            });
        }

        const songQuery = args.join(' ');
        await sock.sendMessage(sender, { text: `🎵 Searching and Downloading *"${songQuery}"*...` });

        // Generate clean tracking filenames
        const timestamp = Date.now();
        const tempDownloadPath = path.join(__dirname, '../', `temp_${timestamp}`);
        const finalMp3Path = path.join(__dirname, '../', `song_${timestamp}.mp3`);

        try {
            // 1. Download the raw audio stream safely
            await ytMdl(`ytsearch1:${songQuery}`, {
                extractAudio: true,
                output: tempDownloadPath + '.%(ext)s',
                noCheckCertificates: true,
                preferFreeFormats: true,
                ffmpegLocation: ffmpeg.path,
                addHeader: ['User-Agent:Mozilla/5.0']
            });

            // 2. Scan and locate the exact file dropped by yt-dlp safely
            const projectDir = path.join(__dirname, '../');
            const files = fs.readdirSync(projectDir);
            const downloadedFile = files.find(f => f.startsWith(`temp_${timestamp}`));

            if (!downloadedFile) {
                return await sock.sendMessage(sender, { text: '❌ Could not download audio stream from YouTube.' });
            }

            const actualDownloadedPath = path.join(projectDir, downloadedFile);

            // 3. Force FFmpeg to map and transcode the data into a true, native MP3 stream container
            const ffmpegCommand = `"${ffmpeg.path}" -i "${actualDownloadedPath}" -vn -ar 44100 -ac 2 -b:a 192k "${finalMp3Path}"`;

            exec(ffmpegCommand, async (err) => {
                // Delete the raw video/audio stream file right away
                if (fs.existsSync(actualDownloadedPath)) fs.unlinkSync(actualDownloadedPath);

                if (err) {
                    console.error('FFmpeg manual conversion error:', err);
                    return sock.sendMessage(sender, { text: '❌ Audio formatting failed during conversion.' });
                }

                // 4. Send the true MP3 file back to the chat room
                if (fs.existsSync(finalMp3Path)) {
                    await sock.sendMessage(sender, {
                        audio: fs.readFileSync(finalMp3Path),
                        mimetype: 'audio/mpeg', // Tells the WhatsApp mobile player to read it instantly
                        fileName: `${songQuery}.mp3`
                    });

                    // Clean up the generated MP3 file so your project folder stays empty and neat
                    fs.unlinkSync(finalMp3Path);
                } else {
                    await sock.sendMessage(sender, { text: '❌ Failed to finalize audio file processing.' });
                }
            });

        } catch (error) {
            console.error('Local Media Render Error:', error);
            await sock.sendMessage(sender, { text: '❌ System error trying to download audio tracks locally.' });
            if (fs.existsSync(finalMp3Path)) fs.unlinkSync(finalMp3Path);
        }
    }
};