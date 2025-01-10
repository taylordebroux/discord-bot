import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Awaken the Squidgemaster');
export async function execute(interaction) {
	await interaction.reply('hey kid, I\'m a computer');
}