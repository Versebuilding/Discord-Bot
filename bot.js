// Run dotenv
require('dotenv').config();

const adp = require('any-date-parser');
const { Format } = require('any-date-parser');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const commands = [
	new SlashCommandBuilder().setName('ping')
		.setDescription('Replies with Pong!'),
	new SlashCommandBuilder().setName('timecommand')
		.setDescription('Converts any times in given text into Discord timezone commands!')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('The input to be parsed for times')
				.setRequired(true))
]; 

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});

const weekdays = [
	"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

function attemptTime(str)
{
	let dayadder = -1;
	let houraddr = -5;
	weekdays.forEach(function(d, i)
	{
		//console.log(`${str} vs ${d}`, str.startsWith(d + " "), str.endsWith(" " + d));
		if (str.startsWith(d + " "))
		{
			str = str.substring(d.length + 1, str.length);
			dayadder = i;

			if (str.startsWith("at ") || str.startsWith("in ") || str.startsWith("on "))
				str = str.substring(3, str.length);

			return;
		}
		else if (str.endsWith(" " + d))
		{
			str = str.substring(0, str.length - d.length - 1);
			dayadder = i;

			if (str.endsWith(" at") || str.endsWith(" on") || str.endsWith(" in"))
				str = str.substring(0, str.length - 3);

			return;
		}
	});

	const atmp = adp.attempt(str);
	console.log("Attempting string: '" + str + "'...:", atmp);

	if (!atmp || atmp.invalid) return null;

	const current = new Date();
	if (dayadder != -1)
	{
		dayadder = dayadder - current.getDay();
		if (dayadder <= 0) dayadder += 7;
	}

	const datetarget = [
		(atmp.year) ? atmp.year : current.getFullYear(),
		(atmp.month) ? atmp.month - 1 : current.getMonth(),
		(atmp.day) ? atmp.day : (current.getDate()),
		((atmp.hour) ? atmp.hour : current.getHours()) + houraddr,
		(atmp.minute) ? atmp.minute : 0, //current.getMinutes(),
		(atmp.second) ? atmp.second : 0 //current.getSeconds()
	];

	if (!atmp.year && atmp.month && (atmp.month < current.getMonth())) datetarget[0]++;
	if (!atmp.month && atmp.day && (atmp.day < current.getDate())) datetarget[1]++;
	if (!atmp.day && dayadder == -1 && atmp.hour && (atmp.hour < current.getHours())) datetarget[2]++;
	if (!atmp.hour && atmp.minute && (atmp.minute < current.getMinutes())) datetarget[3]++;
	if (!atmp.minute && atmp.second && (atmp.second < current.getSeconds())) datetarget[4]++;

	console.log(atmp.hour, current.getHours());

	const target = new Date(
		datetarget[0],
		datetarget[1],
		datetarget[2],
		datetarget[3],
		datetarget[4],
		datetarget[5],
	);

	console.log(current, target);

	let format = "f";

	if ((!atmp.year) && (!atmp.month) && (!atmp.day) && (dayadder == -1)
		&& (!atmp.second))
		format = "t";
	else if ((!atmp.year) && (!atmp.month) && (!atmp.day) && (dayadder == -1)
		&& (atmp.second))
		format = "T";
	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	format = "d";
	else if ((!atmp.hour) && (!atmp.minute) && (!atmp.second))
		format = "D";
	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	format = "F";
	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	format = "R";

	return { "time": Math.round(target.getTime()/1000), "format": format };
}

function getTimes(str)
{
	let times = [];

	let splt = str.split(" ");
	
	// The max length of a time is 6 words
	for (let j = 0; j < splt.length; j++) {
		for (let i = 6; i > 0; i--) {
			if (j + i > splt.length) continue;

			console.log(`\nRunning [${j}-${j+i})`)
			let comp = "";
			for (let x = j; x < j + i; x++) comp += splt[x] + " ";
			comp = comp.trim();
			if (comp.endsWith(".") || comp.endsWith(",") || comp.endsWith("!") || comp.endsWith("?"))
				comp = comp.substring(0, comp.length - 1);

			let time = attemptTime(comp);

			if (time)
			{
				times.push({ "in": `${comp}`, "out": time });
				console.log({ "in": comp, "out": time});

				j += i;
				i = 6;
			}
		}
	}

	// for (const format of adp.formats) {
	// 	// if (
	// 	// 	Array.isArray(format.locales) &&
	// 	// 	format.locales.length > 0 &&
	// 	// 	!format.locales.includes(new Intl.Locale(locale).baseName)
	// 	// ) {
	// 	// 	// some formats only make sense for certain locales, e.g. month/day/year
	// 	// 	continue;
	// 	// }

	// 	const dt = format.getMatches(str);
	// 	const atmp = format.attempt(str);

	// 	console.log("Attempt: ", atmp, "Format: ", dt)
	// }

	return times;
}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction =>
{
	console.log(`Interaction Recieved: ${interaction.user.username}`);

	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'ping') {
		await interaction.reply({ content: 'Pong!', ephemeral: true });
	}
	else if(interaction.commandName === 'timecommand')
	{
		const times = getTimes(interaction.options.getString("input"));
		let content = "";

		times.forEach(e => {
			content += e.in + " → \`<t:" + e.out.time + ":" + e.out.format + ">\`\n";
		});

		if (content == "") content = "No times were found.";
		await interaction.reply({ content: `${content}`, ephemeral: true });
	}
});

client.on('messageCreate', async msg =>
{
	if (msg.author.bot) return;

	console.log(`Message Recieved: ${msg.author.username}`);

	const times = getTimes(msg.content);
	let content = "";

	times.forEach(e => {
		content += `"${e.in}" → <t:${e.out.time}:${e.out.format}>\n`
	});

	if (content == "") return;

	await msg.react("<:timezone_react:981448185128030208>");

	const rfilter = (reaction, user) => {
		//console.log(reaction, user, ('timezone_react' == reaction.emoji.name) && (user.id != client.user.id));
		return ('timezone_react' == reaction.emoji.name) && (user.id != client.user.id);
	};

	msg.awaitReactions(
		{ filter: rfilter, max: 1, time: 60000, errors: ['time'] }
	).then(collected => {
		msg.reply({ content: content});

	}).catch(collected =>
	{
		console.log("Timeout!");
		const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(client.user.id));

		try {
			for (const reaction of userReactions.values()) {
				reaction.users.remove(client.user.id);
			}
		} catch (error) {
			console.error('Failed to remove reactions.');
		}
	});

	// msg.channel.send({ embeds: [
	// 	new MessageEmbed({
	// 		"author": {
	// 			"name": `${msg.author.username}`,
	// 			"iconURL": msg.author.avatarURL(),
	// 			"url": msg.author.defaultAvatarURL },
	// 		"description": msg.content,
	// 		"footer": { 
	// 			"text": "Edited by bot"}
	// 	})
	// ]});
	//msg.delete();
});

client.login(process.env.DISCORD_TOKEN);