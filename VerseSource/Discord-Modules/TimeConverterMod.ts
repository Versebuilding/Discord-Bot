import { CacheType, Client, CommandInteraction, Interaction, Message } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { DiscordModule } from "./DiscordModule";
import { ClientHelper, Debug, MessageReactionCallback, RemoveReactionFromMsg } from "../util-lib";
const adp = require("any-date-parser");

/**
 * This is a wrapper of the
 * "any-date-parser" function "attempt" that instead creates a full date based on any description and
 * also returns the formate that describes the best granularity for the input.
 * 
 * @param str A string that constist of only a description of a date.
 * @returns An object (pair) that containts the UNIX timestamp and Discord format described by input string.
 */
function attemptTime(input: string | null): { time: number; format: string; } | null
{
	var str: string = input ?? "";
	if (str == "") return null;

	const weekdays = [
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	];

	let dayadder = -1;
	let houraddr = -7;
	weekdays.forEach(function(d, i)
	{
		//Debug.Log(`${str} vs ${d}`, str.startsWith(d + " "), str.endsWith(" " + d));
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
	Debug.Log("Attempting string: '" + str + "'...:" + JSON.stringify(atmp));

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
		(atmp.day) ? atmp.day : (current.getDate() + dayadder),
		((atmp.hour) ? atmp.hour : current.getHours()) + houraddr,
		(atmp.minute) ? atmp.minute : 0, //current.getMinutes(),
		(atmp.second) ? atmp.second : 0 //current.getSeconds()
	];

	if (!atmp.year && atmp.month && (atmp.month < current.getMonth())) datetarget[0]++;
	if (!atmp.month && atmp.day && (atmp.day < current.getDate())) datetarget[1]++;
	if (!atmp.day && dayadder == -1 && atmp.hour && (atmp.hour < current.getHours())) datetarget[2]++;
	if (!atmp.hour && atmp.minute && (atmp.minute < current.getMinutes())) datetarget[3]++;
	if (!atmp.minute && atmp.second && (atmp.second < current.getSeconds())) datetarget[4]++;

	//Debug.Log(atmp.hour, current.getHours());

	const target = new Date(
		datetarget[0],
		datetarget[1],
		datetarget[2],
		datetarget[3],
		datetarget[4],
		datetarget[5],
	);

	Debug.Log(current, target);

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

/**
 * Converts any and all date/time references contained in the input string into a UNIX timestamp
 * and a discord format.
 * 
 * @param str English sentences, which may contain date/time references
 * @returns An array of objects that state what english input (in) was used to create a corresponding
 * timestamp and format (out)
 */
function getTimes(input: string | null): { in: string, out: { time: number; format: string; } }[]
{
	var str: string = input ?? "";
	if (str == "") return [];

	let times: { in: string, out: { time: number; format: string; } }[] = [];

	let splt = str.split(" ");
	let count = 0;
	
	// The max length of a time is 6 words
	for (let j = 0; j < splt.length; j++) {
		for (let i = 6; i > 0; i--) {
			if (j + i > splt.length) continue;
			count++;

			//Debug.Log(`\nRunning [${j}-${j+i})`)
			let comp = "";
			for (let x = j; x < j + i; x++) comp += splt[x] + " ";
			comp = comp.trim();
			if (comp.endsWith(".") || comp.endsWith(",") || comp.endsWith("!") || comp.endsWith("?"))
				comp = comp.substring(0, comp.length - 1);

			let time = attemptTime(comp);

			if (time)
			{
				times.push({ in: `${comp}`, out: time });
				//Debug.Log({ "in": comp, "out": time});

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

	// 	Debug.Log("Attempt: ", atmp, "Format: ", dt)
	// }

	Debug.Log(`-> Tried ${count} string(s) and found ${times.length} reference(s) to a time/date`);

	return times;
}

/**
 * Based callback function that can be used to react to user messages for optional timestamps.
 * 
 * @param client Current discord client
 * @param msg Message that was created
 * @returns void
 */
async function OnMessage(msg: Message<boolean>): Promise<void>
{
	const times = getTimes(msg.content);

	let content = "";

	times.forEach(e => {
		content += `"${e.in}" → <t:${e.out.time}:${e.out.format}>\n`
	});

	if (content == "") return;

	MessageReactionCallback(msg, "<:timezone_react:981448185128030208>", _ => {
		Debug.Log(`-> Reaction Recieved on message ${msg.id}`);
		RemoveReactionFromMsg(msg, "<:timezone_react:981448185128030208>");
		msg.reply({ embeds: [{ description: content, author: {
			name: "Time Converter", iconURL: "https://i.ibb.co/Nnsf207/Control-V-modified.png"
		}}] });
	});
}

async function OnCMD_Timecommand(interaction: CommandInteraction<CacheType>)
{
	const times = getTimes(interaction.options.getString("input"));
	let content = "";

	times.forEach(e => {
		content += e.in + " → \`<t:" + e.out.time + ":" + e.out.format + ">\`\n";
	});

	if (content == "") content = "No times were found.";
	await interaction.reply({ embeds: [{ description: content, author: {
		name: "Time Converter", iconURL: "https://i.ibb.co/Nnsf207/Control-V-modified.png"
	} }], ephemeral: true });
}


export class TimeConverterMod extends DiscordModule
{
	Initialize()
	{
		ClientHelper.on("messageCreate", OnMessage,
			msg => !msg.author.bot && msg.channel.type != "DM"
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('timecommand')
				.setDescription('Converts any times in given text into Discord timezone commands!')
				.addStringOption(option =>
					option.setName('input')
						.setDescription('The input to be parsed for times')
						.setRequired(true)),
			OnCMD_Timecommand
		)
	}
}