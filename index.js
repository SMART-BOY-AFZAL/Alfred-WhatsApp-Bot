const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(text, (ans) => { rl.close(); resolve(ans); });
    });
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "110.0.5481.177"],
        keepAliveIntervalMs: 30000
    });

    if (!sock.authState.creds.registered) {
        console.log("⏳ Waiting for stability...");
        await delay(5000);
        const phoneNumber = await question("📞 Enter phone (e.g., 923...): ");
        try {
            const code = await sock.requestPairingCode(phoneNumber.trim());
            console.log(`\n🔑 YOUR PAIRING CODE: ${code}\n`);
        } catch (error) {
            console.error("❌ Pairing Failed:", error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ Bot is ONLINE!');
        } else if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnecting...');
                startBot();
            } else {
                console.log('❌ Logged out. Delete auth_info_baileys folder and restart.');
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message) return;
        const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'antiadmin_db.json');

sock.ev.on('group-participants.update', async (update) => {
    const { id, participants, action, author } = update;
    
    // Read the active anti-admin groups database
    if (!fs.existsSync(dbPath)) return;
    const db = JSON.parse(fs.readFileSync(dbPath));
    
    // If antiadmin is not active in this group, do nothing
    if (!db.includes(id)) return;

    // We only care if someone was demoted
    if (action === 'demote') {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botOwner = '923476860154@s.whatsapp.net'; // 👈 REPLACE WITH YOUR ACTUAL WHATSAPP ID (e.g., '923001234567@s.whatsapp.net')

        for (const target of participants) {
            // Check if the demoted person was you (the owner) or the bot itself
            if (target === botOwner || target === botId) {
                console.log(`⚠️ Anti-Admin Triggered: ${target} was demoted by ${author}`);

                try {
                    // 1. Immediately promote the victim back to Admin
                    await sock.groupParticipantsUpdate(id, [target], 'promote');

                    // 2. Demote the malicious admin who executed the demotion
                    if (author && author !== botId) {
                        await sock.groupParticipantsUpdate(id, [author], 'demote');
                        
                        // 3. Send a warning notice to the chat
                        await sock.sendMessage(id, {
                            text: `🛡️ *Anti-Admin System Activated!*\n\n@${author.split('@')[0]} tried to demote @${target.split('@')[0]}.\n\n✅ Re-promoted the victim.\n❌ Demoted the violator.`,
                            mentions: [author, target]
                        });
                    }
                } catch (err) {
                    console.error('Anti-Admin action failed:', err);
                }
            }
        }
    }
});

        const sender = m.key.remoteJid;
        const msg = m.message;

        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.documentMessage?.caption ||
            msg.buttonsResponseMessage?.selectedDisplayText ||
            msg.listResponseMessage?.title ||
            msg.templateButtonReplyMessage?.selectedDisplayText ||
            '';

        const senderNumber = sender.split('@')[0];
        if (text) console.log(`📩 From ${senderNumber}: ${text}`);

        if (!text || !text.startsWith('.')) return;

        // ─── DYNAMIC COMMAND HANDLER CONNECTIVITY ───
        const commandName = text.slice(1).trim().split(' ')[0].toLowerCase(); // Extracts command word after '.'
        const args = text.trim().split(/ +/).slice(1);
        
        const commandFilePath = path.join(__dirname, 'commands', `${commandName}.js`);

        if (fs.existsSync(commandFilePath)) {
            try {
                // Load and execute the command from the separate file dynamically
                const commandModule = require(commandFilePath);
                await commandModule.execute(sock, sender, text, args, m);
            } catch (error) {
                console.error(`❌ Error running command .${commandName}:`, error);
                await sock.sendMessage(sender, { text: `❌ Error handling command: ${error.message}` });
            }
        }
    });
}

startBot();