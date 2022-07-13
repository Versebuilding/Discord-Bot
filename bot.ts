import { MessageOptions } from "discord.js";
import * as tv from "./VerseSource";
import { FetchTextChannel, Channels, Authors, Buttons, HelpMenus, CommandMenus } from "./VerseSource";

console.log("<><> Start bot of script <><>");

// Run dotenv
require('dotenv').config();

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
		//new tv.TimeConverterMod(),
		new tv.ProfilesMod(),
		new tv.RoleReactMod(),
		new tv.LinkCaptureMod(),
		new tv.HelpMod()
	]

	mods.forEach(element => element.Initialize());

	// Setup modules and their respective commands
	tv.ClientHelper.PushCommands();

	// Login as the bot on the discord.
	tv.ClientHelper.Login(process.env.DISCORD_TOKEN);

	// Activate the webpage for the log
	const server = new tv.VerseServer();
	server.StartServer();
}

Startup().then(async () => {

	// await new Promise(resolve => setTimeout(resolve, 3000));

	// FetchTextChannel(Channels.rules_and_info).then(ch => ch.send({
	// 	embeds: [{
	// 		author: Authors.Help,
	// 		title: "Welcome to The Verse",
	// 		description: "**Click the Info Menu Button** for quick access to a lot of Verse functionality! You can learn about outward content, setup a profile, and access applications/surveys.",
	// 		thumbnail: { url: "https://images-ext-2.discordapp.net/external/TXiqnFNsgnUJy-2sh11Cd59hFpEcIGse_rVS83Jx-bc/https/clipart.world/wp-content/uploads/2020/12/Paint-Splatter-clipart-3.png" }
	// 	}],
	// 	components: [
	// 		...Buttons.ToRows(
	// 			HelpMenus.InfoMenu.GetDMOpenButton()
	// 				.setStyle("PRIMARY")
	// 		),
	// 		...Buttons.ButtonsToRows(
	// 			Buttons.Link({
	// 				label: "Versebuilding.com",
	// 				emoji: "<:verse_oil:992198641991303249>",
	// 				url: "https://versebuilding.com",
	// 			}),
	// 			CommandMenus.profileSetup.GetDMOpenButton(),
	// 			HelpMenus.VerseCreatorApplication.GetDMOpenButton(),
	// 		)
	// 	]
	// }));

	// const jaymsg: MessageOptions = {
	// 	"embeds": [
	// 	  {
	// 		"title": "Animal Realm Interactive Deliverable Prototype v2",
	// 		"color": 15695665,
	// 		"description": "Hi everybody! The second interactive prototype for the Karma Animal Realm deliverable is now accessible on The Verse's Github! We're trying to gauge the readability of the mechanics and their meaning for new players, so once you're done playing we'd appreciate it if you could give some feedback via the Google Form provided in the GitHub page description or in the box below. Thanks!",
	// 		"timestamp": "2022-06-30T18:03:32.614Z",
	// 		"author": {
	// 		  "name": "Jakob Robinson",
	// 		  "url": "https://discord.com",
	// 		  "icon_url": "https://www.animalspot.net/wp-content/uploads/2016/05/Bornean-Orangutan-Face.jpg"
	// 		},
	// 		"image": {
	// 		  "url": "https://user-images.githubusercontent.com/78281215/176745647-1b6579b7-0a08-4bf9-a64a-5102e1fca206.png"
	// 		},
	// 		"thumbnail": {
	// 		  "url": "https://tarotribe.ru/wp-content/uploads/2015/06/1271m.jpg"
	// 		},
	// 		"footer": {
	// 		  "text": "Karma: The Six Realms",
	// 		  "icon_url": "https://tarotribe.ru/wp-content/uploads/2015/06/1271m.jpg"
	// 		},
	// 		"fields": []
	// 	  }
	// 	],
	// 	"components": [
	// 	  {
	// 		"type": 1,
	// 		"components": [
	// 		  {
	// 			"type": 2,
	// 			"style": 5,
	// 			"label": "GitHub Release Page",
	// 			emoji: "<:github:979281491903266826>",
	// 			"url": "https://github.com/Versebuilding/Animal-Realm-Deliverable/releases/tag/Prototype2"
	// 		  },
	// 		  {
	// 			"type": 2,
	// 			"style": 5,
	// 			"label": "Google Forms Link",
	// 			emoji: "📝",
	// 			"url": "https://docs.google.com/forms/d/e/1FAIpQLSdy6Nk9Q_JK1qn9s4Iy8Id76j3OtgeRS4okGrSS5JbGSTtFLw/viewform"
	// 		  },
	// 		]},
	// 	{
	// 		"type": 1,
	// 		"components": [
	// 		{
	// 			"type": 2,
	// 			"style": 5,
	// 			"label": "Windows Download",
	// 			emoji: "<:windows_logo:995922428565930026>",
	// 			"url": "https://github.com/Versebuilding/Animal-Realm-Deliverable/releases/download/Prototype2/Animal.Realm.Deliverable.Windows.zip"
	// 		  },
	// 		  {
	// 			"type": 2,
	// 			"style": 5,
	// 			"label": "MacOS Download",
	// 			emoji: "<:macos_logo:995922425940295710>",
	// 			"url": "https://github.com/Versebuilding/Animal-Realm-Deliverable/releases/download/Prototype2/Animal.Realm.Deliverable.Mac.zip"
	// 		  },
	// 		]
	// 	  }
	// 	]
	//   }

	// FetchTextChannel(Channels.announcements).then(ch => ch.send(jaymsg));
});



