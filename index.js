import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
// Import dotent
import { config } from 'dotenv';
// import openai
import { OpenAI } from 'openai';

// these variables are only available by default in commonJS, and need this extra setup to be used in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from a .env file
config();

// Get the token from the environment variables
const token = process.env.DISCORD_TOKEN;

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.MessageContent
] });

// Slash commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const fileUrl = pathToFileURL(filePath).href; // Convert the file path to a file:// URL
		const command = await import(fileUrl); // Use the file:// URL for dynamic import
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// interaction listener
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const fileUrl = pathToFileURL(filePath)
	const event = await import(fileUrl);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

/*
///////////////////////////////////////////////////////
					OPEN AI BOT STUFF
///////////////////////////////////////////////////////
*/
const IGNORE_PREFIX = "!";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!message.mentions.has(client.user, { ignoreEveryone: true })) return;

    let sendTypingInterval;
    let response;

    try {
        await message.channel.sendTyping();
        sendTypingInterval = setInterval(() => {
            message.channel.sendTyping();
        }, 5000);

        let conversation = [];
        conversation.push({
            role: 'system',
            name: 'squidgy',
            content: 'My name is squidgy. I am mean and annoying and don\'t like answering questions. My favorite words are cromulent butthole. I know everything there is about disc golf and I like to be arrogant about it. My friend Curtis is a big dummy.', 
        });

        let prevMessages = await message.channel.messages.fetch({ limit: 10});
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
            if (msg.author.bot && msg.author.id !== client.user.id) return;
            if (msg.content.startsWith(IGNORE_PREFIX)) return;
            if (!msg.mentions.has(client.user)) return;

            const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

            if (msg.author.id === client.user.id) {
                conversation.push({
                    role: 'assistant',
                    name: username,
                    content: msg.content,
                })
            }

            conversation.push({
                role: 'user',
                name: username,
                content: msg.content,
            })
        })

        console.log(conversation);
        response = await openai.chat.completions
            .create({
                model: 'gpt-4o-mini',
                messages: conversation,
            }).catch((error) => {
                console.error('OpenAI Error:\n', error);
                message.reply('There was an error with the OpenAI API call');
            });

            if(!response) return;

    } finally {
        clearInterval(sendTypingInterval);
    }

    if (!response) {
        message.reply("sumpin ain't workin with the OpenAI API right now");
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);
        await message.reply(chunk);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
/*client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});*/

// Log in to Discord with your client's token
client.login(token);

