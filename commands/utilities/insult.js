import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('insult')
	.setDescription('Generate an insult');
export async function execute(interaction) {
	const verbs = [
		'hairy', 'fladcid', 'queef-tastic', 'geriatric', 'pickled', 'cum-guzzling', 'large', 'morbidly obese', 'semen-squirting', 'questionable'
	];
	const nouns = [
		'buford', 'butthole', 'cuntagon', 'chode', 'abortion salad', 'cum-slut', 'donkey rapist', 'turkey tits'
	];

    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const insult = `You ${randomVerb} ${randomNoun}`;

	await interaction.reply(insult);
}
