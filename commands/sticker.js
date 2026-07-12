const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp'); // Uses the engine we just installed

module.exports = {
    name: 'sticker',
    async execute(sock, sender, text, args, m) {
        const quotedMessage = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = m?.message?.imageMessage;
        const isQuotedImage = quotedMessage?.imageMessage;

        if (!isImage && !isQuotedImage) {
            return await sock.sendMessage(sender, { text: '❌ Please reply to an image or send an image with the caption *.sticker*' });
        }

        await sock.sendMessage(sender, { text: '🎨 Generating your sticker...' });

        try {
            const messageType = isImage ? m.message.imageMessage : quotedMessage.imageMessage;
            
            // 1. Stream the raw image data directly from WhatsApp servers
            const stream = await downloadContentFromMessage(messageType, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Format, resize, and convert to 512x512 WebP using Sharp
            const webpStickerBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Completely transparent margins
                })
                .webp()
                .toBuffer();

            // 3. Send the true WebP file back with correct structural attributes
            await sock.sendMessage(sender, { 
                sticker: webpStickerBuffer,
                mimetype: 'image/webp'
            });

        } catch (error) {
            console.error('Sticker conversion error:', error);
            await sock.sendMessage(sender, { text: '❌ Failed to process sticker format.' });
        }
    }
};