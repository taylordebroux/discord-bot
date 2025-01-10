import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { REST, Routes} from 'discord.js'
// tools for converting urls to file paths to be used as __filename and __dirname
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';

config();
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const fileUrl = pathToFileURL(filePath).href; // Convert the file path to a file:// URL
		const command = await import(fileUrl); // Use the file:// URL for dynamic import
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);


// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
 
		await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [] },
        );
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();