import { SlashCommandBuilder } from "@discordjs/builders";
import * as tv from "./Verse Source"; // tv for "The Verse"
import { Debug, GlobalVariables } from "./Verse Source";

// Run dotenv
require('dotenv').config();

const { REST } = require('@discordjs/rest');
const { Client, Intents } = require('discord.js');

// Create the client for discord
GlobalVariables.client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});

async function Startup()
{
	try
	{
		await tv.SheetsWrapper.Initialize();
	}
	catch (exc)
	{
		console.error(exc);
		console.error(">>>CRITICAL ERROR<<< There was an error with initailizing the google api.");
		return;
	}

	// Select the modules that should be loaded
	const mods: tv.DiscordModule[] = [
		new tv.LoggingMod(),
		new tv.CoreMod(),
		new tv.TimeConverterMod(),
		new tv.RoleReactMod()
	]

	// Setup modules and their respective commands
	tv.SetupCommands(mods);
	mods.forEach(mod => mod.Initialize(GlobalVariables.client));

	// Login as the bot on the discord.
	GlobalVariables.client.login(process.env.DISCORD_TOKEN);

	// Activate the webpage for the log
	const server = new tv.VerseServer();
	server.StartServer();
}

GlobalVariables.client.on("interactionCreate", async i => {
	if (i.isButton())
	{
		console.log("Got a button interaction! => " + i.customId);
	}
});

Startup();