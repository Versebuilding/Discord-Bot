console.log("<><> Start bot of script <><>");


console.log("Loading and configuring Debugging/Logging tools...");

import { Debug } from "./VerseSource/Logging";


Debug.Log("Loading and configuring 'dotenv'...");

import * as dotenv from "dotenv";
dotenv.config();


Debug.Log("Loading and configuring source scripts....");

import { GoogleClient, ClientHelper, Fetch, Channels, Authors, Buttons, HelpMenus, CommandMenus } from "./VerseSource";

Debug.Log("Initializing all mods...");

// Logging mod comes first so that its listener is before the ClientHandler's.
import "./VerseSource/Discord-Modules/LoggingMod";
import "./VerseSource/Discord-Modules/CoreMod";
import "./VerseSource/Discord-Modules/ProfilesMod";
import "./VerseSource/Discord-Modules/RoleReactMod";
//import "./VerseSource/Discord-Modules/LinkCaptureMod";
import "./VerseSource/Discord-Modules/HelpMod";
import "./VerseSource/Discord-Modules/VotingMod";
import "./VerseSource/Discord-Modules/ShoutoutMod";
import "./VerseSource/Discord-Modules/BotStatusMod";
import "./VerseSource/Discord-Modules/EventVCMod";
import "./VerseSource/Discord-Modules/InsightsMod";

// Activate the webpage for the log
Debug.Log("Loading and initializing web server...");
import "./VerseSource/weblib";
import { MessageOptions } from "discord.js";


async function Startup()
{
	try
	{
		Debug.Log("Initializing Google API Client...");
		await GoogleClient.Initialize();
	}
	catch (exc)
	{
		Debug.Critical("There was an error with initializing the google api.", exc);
		throw new Error("There was an error with initializing the google api.");
	}

	// Setup modules and their respective commands
	Debug.Log("Initializing all mods...");
	await ClientHelper.PushCommands();

	// Login as the bot on the discord.
	Debug.Log("Logging into discord account...");
	await ClientHelper.Login(process.env.DISCORD_TOKEN);
}

async function GetAnnounceMessage(memid: string): Promise<MessageOptions>
{
	const mem = await Fetch.Member(memid);
	return {
		"content": "@everyone Check out this new game from the U4EA team! Play in browser with WebGL button.",
		"embeds": [
		  {
			"title": "The Life in Color",
			"color": 0x53dada,
			"description": "The Life In Color is a 2D platformer, where you are thrust into a world devoid of all color besides the harmony temples. It is up to you to traverse these temples and reintroduce color throughout ",
			"timestamp": "2022-08-22T13:00:00.614Z",
			"author": {
			  "name": mem.displayName,
			"icon_url": mem.displayAvatarURL()
			},
			"thumbnail": {
			  "url": "https://raw.githubusercontent.com/SperlingDane/The-Life-In-Color/main/GameThumbnail.jpg"
			},
			"footer": {
			  "text": "U4EA",
			  "icon_url": "https://static.wixstatic.com/media/1499fe_057282bb07574dd7bc448ca78410903d~mv2.png/v1/crop/x_145,y_151,w_203,h_192/fill/w_284,h_269,al_c,lg_1,q_85,enc_auto/1499fe_057282bb07574dd7bc448ca78410903d~mv2.png"
			},
			"fields": []
		  }
		],
		"components": [
		  {
			"type": 1,
			"components": [
			  {
				"type": 2,
				"style": 5,
				"label": "GitHub Release Page",
				emoji: "<:github:979281491903266826>",
				"url": "https://github.com/SperlingDane/The-Life-In-Color/releases/tag/v1.0"
			  },
			{
				"type": 2,
				"style": 5,
				"label": "Windows Download",
				emoji: "<:windows_logo:995922428565930026>",
				"url": "https://github.com/SperlingDane/The-Life-In-Color/releases/download/v1.0/U4Ea.Build.zip"
			  },
			  {
				"type": 2,
				"style": 5,
				"label": "WebGL",
				emoji: "<:webpagelogo:979282120583294976>",
				"url": "https://www.versebuilding.com/github-viewer/DaneU4EA/"
			  },
			]
		  }
		]
	}
}

Startup().then(async () =>
{
	Debug.Banner("BgGreen", "Setup Complete");

	process.on("uncaughtException", (e) =>
	{
		Debug.Critical(e);

		try
		{
			ClientHelper.ForceCrash();
			ClientHelper.client?.user?.setPresence({
				activities: [
					{
						name: "CRASHED",
						type: "PLAYING"
					}
				],
				status: "dnd",
				afk: false,
			});
		}
		catch (exc)
		{
			Debug.LogError("Could not update crash status.", exc);
		}
	});

	const onexit = () =>
	{
		Debug.Banner("BgRed", "Shutting down...");
		ClientHelper.ForceCrash();
		setTimeout(process.exit, 2500);
	}

	//do something when app is closing
	process.on('exit', () => { ClientHelper.ForceCrash(); });

	//catches ctrl+c event
	process.on('SIGINT', onexit);

	// catches "kill pid" (for example: nodemon restart)
	process.on('SIGUSR1', onexit);
	process.on('SIGUSR2', onexit);

	var messageCount: number = 0;
	var reactionCount: number = 0;
	var timeCutoff = Date.now() - (1000 * 60 * 60 * 24 * 2) - (1000 * 60 * 60 * 4);
	for await (const [_, channel] of await (await Fetch.Guild()).channels.fetch())
	{
		if (channel.type === "GUILD_TEXT")
		{
			var msgPointer: string | undefined = undefined;
			do {
				await channel.messages.fetch({ limit: 100, before: msgPointer }).then(ms =>
				{
					msgPointer = (ms.last()?.createdTimestamp > timeCutoff) ? ms.last()?.id : undefined;
					ms.forEach(m =>
					{
						if (m.createdTimestamp > timeCutoff)
						{
							messageCount++;
							m.reactions.cache.forEach(r =>
							{
								reactionCount += r.count;
							});
						}
					})
				});
			} while (msgPointer);
		}
	}

	// Fetch.TextChannel(Channels.announcements).then(async (channel) =>
	// 	channel.send(await GetAnnounceMessage("597996388797906976")));
	

	// Fetch.TextChannel(Channels.team_communication).then(async (channel) => channel.send(
	// {
	// 		content: "@everyone",
	// 		embeds: [{
	// 		color: "AQUA",
	// 		title: "Verse Update! 📰",
	// 		description: "Weekly Verse Update. From <t:1660759200:f> to <t:1661369400:f>",
	// 		fields: [
	// 			{
	// 				name: "🆕 Newest Members",
	// 				value: [
	// 					["1009908845239345242", "Cognitive Neuroscience and Music Performance dual major, interested in <@&984342387776192522> and <@&974062599341740102>"],
	// 				].map(([name, desc]) => `<@${name}>: ${desc}`).join("\n\n"),
	// 				inline: false,
	// 			},
	// 			{
	// 				name: "👔 Outstanding Titles (2 weeks)",
	// 				value: [
	// 					["438507883433295885", "Button Pusher", "Buttons used (34)"],
	// 					["457097328025665537", "Chief Editor", "Edited Messages (10)"],
	// 					["981250697444094032", "Speed Reacter", "Message reactions within 10min (7)"],
	// 					["177000670354866177", "Workaholic", "Active Online Time (1.5 Days)"],
	// 					["938483914153001032", "Sleeper Agent", "No Online Time (6hr of Idle Time)"],
	// 					["555365033018654746", "Telephone Advocate", "% Time spent in VC (68% of online time). *More than anyone by 60% excluding Ben (48%)!*"],
	// 				].map(([name, title, desc]) => `**${title}**, <@${name}>: ${desc}`).join("\n"),
	// 				inline: false,
	// 			},
	// 			{
	// 				name: "📊 Insights and Statistics",
	// 				value: [
	// 					["<:verse_oil:992198641991303249>", "Total Creators", "60 members"],
	// 					["📅", "Events", "11 events"],
	// 					["📊", "Message Count", `${messageCount} messages`],
	// 					["🎭", "Reactions", `${reactionCount} reactions`],
	// 				].map(([emoji, name, desc]) => `${emoji} **${name}**: ${desc}`).join("\n"),
	// 				inline: false,
	// 			},
	// 		]
	// 	}]
	// }).then(() =>
	
	// {
	// 	channel.send({
	// 		content: "@everyone",
	// 		embeds: [{
	// 			color: "GREEN",
	// 			title: "Content Releases! 🎯",
	// 			description: "The new content that projects have created and developed!",
	// 		}, {
	// 			color: "GREEN",
	// 			title: "Karma the Game! 🎭",
	// 			description: "More art? More content? More fun? More fun! Posts from <@822163023271165962> <@97170399581704192> <@547704645011767296>",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/8-17_8-24_KarmaContent.jpg" }
	// 		}, {
	// 			color: "GREEN",
	// 			title: "Adventures In Breath! 🫁",
	// 			description: "Breath Library is almost to a completely working state. Check out this visualizer to see how it's going! Built by <@613052898804367382> <@151508052623884290> <@457097328025665537>",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/8-17_8-24_AiBContent.jpg" }
	// 		}, {
	// 			color: "GREEN",
	// 			title: "Web Dev! 🌐",
	// 			description: "Dynamically generated web pages from Discord Info are coming soon! Interested in learning how? See <@457097328025665537>",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/8-17_8-24_WebdevContent.jpg" }
	// 		}, {
	// 			color: "GREEN",
	// 			title: "Web 3.0! 🪙",
	// 			description: "Plans to add web 3.0! Check out Miros by <@555365033018654746>: [Tokenization](https://miro.com/app/board/uXjVPe-gIpc=/?share_link_id=363171877168) and [Sandbox Business Model] (https://miro.com/app/board/uXjVPe54--U=/). Want to develop a web 3.0 application? See <@457097328025665537>",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/8-17_8-24_Web3Content.jpg" }
	// 		}, {
	// 			color: "GREEN",
	// 			title: "WalkXR! 🚶",
	// 			description: "Logos in the works! Thanks to <@804963784913322035>",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/8-17_8-24_WalkContent.jpg" }
	// 		},
	// 		]
	// 	});
	// }).then(() =>
	// {
	// 	channel.send({
	// 		content: "@everyone",
	// 		embeds: [
	// 		{
	// 			color: "GOLD",
	// 				title: "Gratitude Shout-Outs! 🎊",
	// 			description: [
	// 				["809535079411351653", "555365033018654746", "Thanks for the comprehensive Web3/Tokensation miros (x2) and the well articulated explanation  you provided today at the Web3 meeting."],
	// 				["809535079411351653", "822163023271165962", "I appreciate the style, quality, and proficiency of your art (aka contributions to The Verse). We will miss you!"],
	// 			].map(([from, to, desc]) => `**From** <@${from}>, **to** <@${to}>: ${desc}`).join("\n\n")
	// 		},
	// 			{
	// 			color: "BLUE",
	// 			title: "Music Shout-Outs! 🎶",
	// 			description: [
	// 				["147950851598581760", "Brisk Yellow", "Blazo", "Colors of Jazz", "https://www.deezer.com/track/77326423"],
	// 			// 	["809535079411351653", "Bam Bam", "Sister Nancy", "One Two", "https://www.deezer.com/track/709090552"],
	// 			// 	["457097328025665537", "Dear Maria, Count Me In", "All Time Low", "So Wrong, It's Right", "https://www.deezer.com/track/6249577"],
	// 			// 	["147950851598581760", "Tek It", "Cafuné", "Tek It (I Watch the Moon)", "https://www.deezer.com/track/1733808287"],
	// 			].map(([from, title, artist, desc, url]) => `From <@${from}>, [${title}](${url}) by ${artist}, album ${desc}`).join("\n\n")
	// 		}]
	// 	});
	// }));

	// Fetch.TextChannel(Channels.team_communication).then(async (channel) => channel.send(
	// {
	// 		content: "@everyone",
	// 		embeds: [{
	// 		color: "AQUA",
	// 		title: "Verse Update! 📰",
	// 		description: "Weekly Verse Update. From <t:1658935800:f> to <t:1659540600:f>",
	// 		fields: [
	// 			{
	// 				name: "🆕 Newest Members",
	// 				value: [
	// 					["812148010494591016", "interested in <@&978163649891942431> and <@&974062599341740102>"],
	// 					["229641566980014080", "interested in <@&978162584555507732> and <@&984342387776192522>"],
	// 					["708073641136357406", "interested in <@&984342524565016636> and <@&978163622889029663>"],
	// 				].map(([name, desc]) => `<@${name}>: ${desc}`).join("\n\n") + "\n*Several other new members are incoming, awaiting approval/application.*",
	// 				inline: false,
	// 			},
	// 			{
	// 				name: "👔 Outstanding Titles",
	// 				value: [
	// 					["822163023271165962", "Introvert", "Longest total DND time (1 Days 10 Hours)"],
	// 					["973155480287477770", "Button Pusher", "Most Buttons Used (53 total)"],
	// 					["809535079411351653", "Re-thinker", "Most Message Edits (41 total)"],
	// 					["457097328025665537", "Quick to React", "Most messages reacted to within 10min (10 total)"],
	// 					["748322593844494487", "Last One Out", "Most times being last to leave VC (2 total)"],
	// 				].map(([name, title, desc]) => `**${title}**, <@${name}>: ${desc}`).join("\n"),
	// 				inline: false,
	// 			},
	// 			{
	// 				name: "📊 Insights and Statistics",
	// 				value: [
	// 					["<:verse_oil:992198641991303249>", "Total Creators", "48 members"],
	// 					["📅", "Events", "11 events"],
	// 					["📊", "Message Count", `${messageCount} messages`],
	// 					["🎭", "Reactions", `${reactionCount} reactions`],
	// 				].map(([emoji, name, desc]) => `${emoji} **${name}**: ${desc}`).join("\n"),
	// 				inline: false,
	// 			},
	// 		]
	// 	}]
	// }).then(() =>
	// {
	// 	channel.send({
	// 		content: "@everyone",
	// 		embeds: [{
	// 			color: "GREEN",
	// 			title: "Content Releases! 🎯",
	// 			description: "The new content that projects have created and developed!",
	// 		}, {
	// 			color: "GREEN",
	// 			title: "WalkXR 🚶‍♂️",
	// 			description: "By <@1001535857620168764>: A walk combining magical spiritual images onto daily images, [original message](https://discord.com/channels/848804519847526460/878748765169811497/1004126871795015742)!",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/7-27_8-3_WalkContent.jpg?" }
	// 		}, {
	// 			color: "GREEN",
	// 			title: "Karma the Game! 🎭",
	// 			description: "Tons of new art:",
	// 			image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/7-27_8-3_KarmaContent.jpg" }
	// 		}]
	// 	});
	// }).then(() =>
	// {
	// 	channel.send({
	// 		content: "@everyone",
	// 		embeds: [
	// 		{
	// 			color: "GOLD",
	// 			title: "Gratitude Shout-Outs! 🎊",
	// 			// description: [
	// 			// 	["457097328025665537", "984191145246617671", "You have been doing some really amazing work with the AiB flagship game! I am really excited about what we can do next!"],
	// 			// 	["809535079411351653", "981250697444094032", "Thanks for your hard work and VISION on improving project management in The Verse."],
	// 			// 	["809535079411351653", "374079182357004289", "Great job taking the inititiave this week. I really appreciate your offer to help with community management."],
	// 			// 	["457097328025665537", "547704645011767296", "Amazing work on creating the karma realm skins. They are so beautiful and professional 😍✨"],
	// 			// 	["457097328025665537", "147950851598581760", "I'm not sure if it is ever brought up, but inaddition to working so hard on Karma, Michelle is always super active and responsive to everything in the verse. I love all of the message reactions and comments you make!"],
	// 			// 	["97170399581704192", "822163023271165962", "Thanks Luke! It's been great working on assets for the Animal Realm Deliverable with you. You've done a lot of work and have been great at changing stuff to fit the shaders we're going to implement."],
	// 			// 	["407708842026074112", "177000670354866177", "Thanks for taking initiative with the Sound and Color role in Karma! Looking forward to collabing with consistency and creativity on each of the realms/experiences :)"],
	// 			// 	["407708842026074112", "407708842026074112", "👑u amaze me👑"],
	// 			// 	["809535079411351653", "97170399581704192", "For being one of the first people to release a demoable game, AND all of the time he spends putting the content for Karma animal realm together."],
	// 			// 	["809535079411351653", "151508052623884290", "Working hard to create new content with AiB. Building another ladder!"],
	// 			// 	["809535079411351653", "613052898804367382", "For building a VR application for AiB!  Thank you!"],
	// 			// 	["151508052623884290", "457097328025665537", "Going out of his way to help me out with the AiB Ladder Project! Really Thankful!"]
	// 			// ].map(([from, to, desc]) => `**From** <@${from}>, **to** <@${to}>: ${desc}`).join("\n\n")
	// 			description: "N/A"
	// 		},
	// 			{
	// 			color: "BLUE",
	// 			title: "Music Shout-Outs! 🎶",
	// 			description: [
	// 				["809535079411351653", "Enemy (from the series Arcane League of Legends)", "Imagine Dragons", "Enemy (from the series Arcane League of Legends)", "https://www.deezer.com/track/1535046792"],
	// 				["809535079411351653", "Bam Bam", "Sister Nancy", "One Two", "https://www.deezer.com/track/709090552"],
	// 				["457097328025665537", "Dear Maria, Count Me In", "All Time Low", "So Wrong, It's Right", "https://www.deezer.com/track/6249577"],
	// 				["147950851598581760", "Tek It", "Cafuné", "Tek It (I Watch the Moon)", "https://www.deezer.com/track/1733808287"],
	// 			].map(([from, title, artist, desc, url]) => `From <@${from}>, [${title}](${url}) by ${artist}, album ${desc}`).join("\n\n")
	// 		}]
	// 	});
	// }));

	// Fetch.TextChannel(Channels.rules_and_info).then(ch => ch.send({
	// 	embeds: [{
	// 		author: Authors.Help,
	// 		color: "AQUA",
	// 		title: "Server Rules 📔",
	// 		description: "We at The Verse have some rules in place to ensure a safe environment for everyone here.",
	// 		thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/760/760205.png" },
	// 		fields: [{
	// 			name: "🔞 NSFW Content",
	// 			value: "Any form of NSFW content is strictly forbidden, if you are found posting content of this nature, you will be banned on the spot.",
	// 			inline: false,
	// 		}, {
	// 			name: "☮️ Defamation and Derogatory Behavior",
	// 			value: "Absolutely no Racist, Sexist, or otherwise degrading behavior will be tolerated. Anyone displaying this behavior will be banned.",
	// 			inline: false,
	// 		}, {
	// 			name: "📳 Spam",
	// 			value: "Small spam is okay, but don't go crazy and massively spam the chats.",
	// 			inline: false,
	// 		}, {
	// 			name: "💟 Respect",
	// 			value: "Everyone deserves an equal amount of respect, so make sure to respect everyone.",
	// 			inline: false,
	// 		}, {
	// 			name: "⛔ Mentions and Direct Messaging",
	// 			value: "Do not ping or DM the Developers or Admin without good reason or explicit permissions.",
	// 			inline: false,
	// 		}]
	// 	}, {
	// 		title: "Getting Started? 🆕",
	// 		color: "FUCHSIA",
	// 		description: "Thank you for joining The Verse Discord server! Check out the following channels to get started.",
	// 		thumbnail: { url: "https://theme.zdassets.com/theme_assets/1332047/4acd41293a735190ff0f1c41be28d2f5ad5a91bf.png" },
	// 		fields: [{
	// 			name: "📔 Want to learn More?",
	// 			value: "<#848805001643556874> Learn about how to use our Discord server",
	// 			inline: false,
	// 		}, {
	// 			name: "⚙️ Got skills?",
	// 			value: "<#848810485397979186> Select your projects and skills.",
	// 			inline: false,
	// 		}, {
	// 			name: "🤝 Interested in the community?",
	// 			value: "<#848805950282268692> Introduce yourself to The Verse.",
	// 			inline: false,
	// 		}, {
	// 			name: "📰 Looking for some fun content?",
	// 			value: "<#979244080494182430> Check out the latest developments.",
	// 			inline: false,
	// 		}]
	// 	}, {
	// 		title: "Welcome to The Verse <:verse_oil:992198641991303249>",
	// 		color: "GOLD",
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
	//}

	// FetchTextChannel(Channels.announcements).then(ch => ch.send(jaymsg));
});



