import { Events, MessageFlags } from 'discord.js';
import { config } from 'dotenv';
config();

export const name = Events.MessageCreate;
export function execute(message, client) {
    const channel = message.channel;

    if (message.mentions.users.has(client.user.id)) return;

    if (message.content.toLowerCase().includes('nine springs')) {
        if (message.author.bot) return;
        const responses = [
            'Cash is king!',
            'Smile, you\'re on camera!',
            'I\'m Rob Brose and Nine Springs is the best course ever',
            'Five dollars a round, not 2 or 3',
            'You still need to pay the greens fee on top of the tournament fee',
        ];
        setTimeout(() => {
            const randomReply = responses[Math.floor(Math.random() * responses.length)];
            message.reply(randomReply);
        }, 2000);
    }

}