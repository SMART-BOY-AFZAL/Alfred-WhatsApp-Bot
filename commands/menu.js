module.exports = {
    name: 'menu',
    async execute(sock, sender, text, args) {
        const menuText = `🤖 *WHATSAPP BOT MENU* 🤖

🤖 *General Commands:*
🔹 \`.menu\` - View all available bot commands.
🔹 \`.ping\` - Check the bot's response speed.
🔹 \`.uptime\` - See how long the bot has been running without interruption.

🎵 *Media & Utilities:*
🔹 \`.play [song name]\` - Downloads and plays high-quality MP3 audio from YouTube.
🔹 \`.sticker\` - Converts your image, video, or GIF into a WhatsApp sticker.

💡 *Tip:* Always include the dot (\`.\`) before typing a command!`;

        await sock.sendMessage(sender, { text: menuText });
    }
};