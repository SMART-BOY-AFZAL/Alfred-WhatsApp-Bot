module.exports = {
    name: 'ping',
    async execute(sock, sender, text, args) {
        await sock.sendMessage(sender, { text: '🏓 Pong! Bot is alive and running!' });
    }
};