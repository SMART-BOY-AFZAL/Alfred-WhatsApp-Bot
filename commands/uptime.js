module.exports = {
    name: 'uptime',
    async execute(sock, sender, text, args) {
        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);
        await sock.sendMessage(sender, { text: `⏱️ *Uptime:* ${hrs}h ${mins}m ${secs}s` });
    }
};