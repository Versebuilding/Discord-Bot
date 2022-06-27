import { userMention } from "@discordjs/builders";
import { ButtonInteraction, CacheType, MessageActionRow, MessageActionRowComponent, MessageButton, MessageButtonOptions, MessageComponentOptions, MessageEmbed, MessageEmbedOptions, MessageOptions, TextBasedChannel } from "discord.js";
import { AddButtonsToRow, AskTextQuestion, ButtonCallbackMap, ConfirmButtonInteraction, CreateMCCWithFooterTimer, CustomLock, Debug, EditAppendFieldTitle, EmbeddedPreviewMessage, FetchButtonMessage, FetchMember, FetchMessageFromURL, FetchTextChannel, GetComponentFromMessage, IconLinks, SendConfirmation } from "../../util-lib";
import { GetLinksFromString } from "../LinkCaptureMod";
import { OnboardingMod, SendMessage } from "../OnboardingMod";

var x: MessageComponentOptions
type ECO = [MessageEmbedOptions, MessageButtonOptions[]];

export function GetButtonIdTable(map: ButtonCallbackMap):
	[string, (interaction: ButtonInteraction<CacheType>) => Promise<boolean | void>][]
{

var main: ECO, learn_1: ECO, learn_2: ECO, nickname: ECO,
	roles: ECO, selfIntro: ECO, tools: ECO,
	questions: ECO, firstInterview: ECO, submit: ECO;

/********************************************************/
/*            Main Menu for Pre Interview (0)           */
/********************************************************/
main = [{
	title: "Pre-Interview (pg 0)",
	color: 4321431,
	description: "There are a few tasks and a lot of information that we want to make sure that you have seen before becoming a part of The Verse. Below this message are buttons which will load different pages of this message. Each page has a form/conformation which will be added to this message as you go. Feel free to do in any order, the message will update/repost each time a task is completed."
}, [{
	style: 1,
	label: "Learn About The Verse (pg 1)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(learn_1)),
	disabled: false,
	emoji: "ℹ️",
	type: 2
}, {
	style: 1,
	label: "Set Server Nickname (pg 2)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(nickname)),
	disabled: false,
	emoji: "👔",
	type: 2
}, {
	style: 1,
	label: "Set Server Roles (pg 3)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(roles)),
	disabled: false,
	emoji: "🎏",
	type: 2
}, {
	style: 1,
	label: "Introduce Yourself (pg 4)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(selfIntro)),
	disabled: false,
	emoji: "👋",
	type: 2
}, {
	style: 1,
	label: "Get Access to Verse Tools (pg 5)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(tools)),
	disabled: false,
	emoji: "🛠️",
	type: 2
}, {
	style: 1,
	label: "Interview Questions (pg 6)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(questions)),
	disabled: false,
	emoji: "❔",
	type: 2
}, {
	style: 1,
	label: "Set First Interview? (pg 7)",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(firstInterview)),
	disabled: false,
	emoji: "☎️",
	type: 2
}, {
	style: 1,
	label: "Submit",
	customId: map.MakeBtnId(
		Conf.bind("Are you sure you want to submit the application? Does everything look good?"),
		async function presumbit(b) {
			const msg = await FetchButtonMessage(b);
			msg.embeds.pop();

			
		}
	),
	disabled: true,
	emoji: "📥",
	type: 2
}, {
	style: 1,
	label: "Cancel",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(firstInterview)),
	disabled: false,
	emoji: "⏏️",
	type: 2
}]
];

async function PreChangeToMain(button: ButtonInteraction<CacheType>)
{
	var msg = await FetchButtonMessage(button);

	var comp = GetComponentFromMessage(msg, button.customId) as MessageButton;

	if (this.completed)
	{
		msg.embeds[0].fields.find(f => f.name = this.name).value = this.value;
	}

	var content: ECO = this;

	content[0].author = OnboardingMod.author;

	msg.embeds[msg.embeds.length - 1] = new MessageEmbed(content[0]);
	msg.components = AddButtonsToRow(content[1].map((b, i) => {
		var btn = new MessageButton(b);
		if (msg.embeds[0].fields[i].name != "`Incomplete`")
			btn.setStyle("SECONDARY");
		return btn;
	}));

	await CustomLock.WaitToHoldKey(msg.id, () => msg.edit({
		embeds: msg.embeds,
		components: msg.components
	}));
}

/********************************************************/
/*              Learn About The Verse (1)               */
/********************************************************/
learn_1 = [{
	title: "Learn: Outward Content (1.1)",
	color: 4321431,
	description: "Welcome to The Verse! While you are waiting for interviews and/or internal access, you should familiarize yourself with our goals and projects by viewing some of our outward facing content. Once you have been added, we have an extensive list for each project available. Here are a few links that we think show the best of the best:",
	fields: [
	{
		"name": "Versebuilding Landing Page",
		"value": "If you haven't already, our [Landing Page](https://versebuilding.com/) is a must! This is the first page that community members and investors see when learning about The Verse. This webpage shows our mission, team, projects and so much more!",
		"inline": true
	},
	{
		"name": "The Verse: Discord",
		"value": "You are already appart of [our discord](https://discord.com/channels/848804519847526460/979244080494182430), but make sure you check out our [Announcements page](https://discord.com/channels/848804519847526460/979244080494182430). This is a great place to learn about our most recent milestones and even game out a bit!",
		"inline": true
	}
	]
}, [{
	style: 4,
	label: "Back",
	customId: map.MakeBtnId(PreChangeToMain),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Next",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(learn_2)),
	disabled: false,
	emoji: "➡️",
	type: 2
}]
];

/********************************************************/
/*                Discord Introduction                  */
/********************************************************/
learn_2 = [{
	title: "Learn: Discord Intro (1.2)",
	color: 4321431,
	description: "**Discord can be confusing and overwhelming** if you are new or not familiar with similar platforms. Discord is used for all of our communication, including direct and group messaging and voice/video calling. We have listed out some terminology to help with completing onboarding, and you can always [learn more here](https://support.discord.com/hc/en-us/articles/360045138571-Beginner-s-Guide-to-Discord), or by searching online yourself.",
	fields: [
	{
		"name": "Servers and Direct messaging",
		"value": "Servers are listed on the right of discord, and represent a group or orginization. Our server is called “The Verse”. Direct messaging automatically happens outside of the server and is located at the top left above all of your servers.",
		"inline": false
	},
	{
		"name": "Categories and Channels",
		"value": "Categories are only used for grouping channels. The Verse has a few categories, including “Information” and “General”. Channels are groups chats used to divide different conversations, mainly used for separating project conversations, announcements, and other. There are both Voice and Text channels.",
		"inline": false
	},
	{
		"name": "Roles and User Information",
		"value": "As a Discord user, you can set your own profile information to identify yourself better. In addition to your default profile, you also have a “member” profile for each server that you are added to. You can view yours and others profile by clicking on a username/icon. While you are viewing the information within our server, you can see all of the roles that person has. These roles are used in “@” messages in order to notify everyone under a specific group. Roles are also useful for keeping track of who is in what projects or has specific skills.",
		"inline": false
	}
	]
}, [{
	style: 2,
	label: "Back",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(learn_1)),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Done!",
	customId: map.MakeBtnId(
		Conf.bind("Are you sure you understand all of the information listed in this section?"),
		PreChangeToMain.bind({ name: main[1][0].label, value: "`I understand the information`", completed: true })),
	disabled: false,
	emoji: "➡️",
	type: 2
}]
];

/********************************************************/
/*                 Set Server Nickname                  */
/********************************************************/
nickname = [{
	title: "Set Server Nickname (2)",
	color: 4321431,
	description: "If you are going to be a Verse Creator, it would really help if the team can easily identify who you are. Please set your server nickname to your preferred name / nickname. Do this by entering the server and either \n> 1) clicking on your own profile inside the server, or \n> 2) clicking the server banner (top left, above all channels) and selecting “Edit server profile”.\nThere are no hard restrictions, however, we recommend using preferred name with proper capitalization, followed by a last name or last initial.",
}, [{
	style: 3,
	label: "Back",
	customId: map.MakeBtnId(PreChangeToMain),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Done!",
	customId: map.MakeBtnId(
		async b => {
			var mem = await FetchMember(b.user.id);
			if (await Conf.bind("Are you sure the name `" + mem.displayName + "` is an appropriate server name?")())
				return;
			PreChangeToMain.bind({ name: main[1][1].label, value: "`" + mem.displayName + "`", completed: true })();
		}),
	disabled: false,
	emoji: "☑️",
	type: 2
}]
];

/********************************************************/
/*                Set Server Roles (3)                  */
/********************************************************/
nickname = [{
	title: "Set Server Roles (3)",
	color: 4321431,
	description: "As stated in “Discord Information”, Roles are also useful for keeping track of who is in what projects or has specific skills, an important part of collaboration and finding help. You can assign yourself to these roles by visiting the [role-assign](https://discord.com/channels/848804519847526460/848810485397979186) channel within The Verse. Clicking on the buttons will give you a private message stating the role change and the message will update that role’s count. Once you’ve added a role will be able to see your new roles by viewing your server profile. If you are not added to a project yet, you can add yourself to the projects that you are interested in, and update it later. If you are unsure about what projects you want to be apart of, feel free to just update your skills and come back to this later.",
}, [{
	style: 3,
	label: "Back",
	customId: map.MakeBtnId(PreChangeToMain),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Done!",
	customId: map.MakeBtnId(
		async b => {
			var mem = await FetchMember(b.user.id);
			var content = "";
			if (mem.roles.cache.size < 3)
				content = "Are you sure you completed this task? You look like you don't have any of the project or skill roles. Consider rereading this task as you will not be given permissions until this is done."
			else
				content = "Looks good to us! Just confirm that these are the roles that you selected ('Community' and '@everyone' by default)."
			content += "\n**Your Roles:**" + mem.roles.cache.map(r => r.name).join("\n");

			if (await Conf.bind(content)())
				return;
			PreChangeToMain.bind({
				name: main[1][1].label,
				value: "`" +mem.roles.cache.map(r => r.name).join(", ") + "`",
				completed: true
			})();
		}),
	disabled: false,
	emoji: "☑️",
	type: 2
}]
];

/********************************************************/
/*                  Introduce Yourself                  */
/********************************************************/
{
	"embeds": [{
		"title": "Introduce Yourself",
		"color": 4321431,
		"description": "In our discord server, we have a channel named [Introductions](https://discord.com/channels/848804519847526460/848805950282268692) for you to introduce yourself and meet some of the other members. If you would like, you can either write your own message to the channel, or you can fill out the questions here and get your introduction posted in a fancy message (embed). Bonus points for the more creative your answers are!\n*You must answer all questions before you can send the message.*",
		"fields": [
			{
				"name": "1️⃣ Name/Pronouns",
				"value": "What is your name? Any nick names? What are your pronouns?",
				"inline": true
			},
			{
				"name": "2️⃣ Location",
				"value": "Where did you grow up? Where you are based now?",
				"inline": true
			},
			{
				"name": "3️⃣ Career/Academic background",
				"value": "In a sentence or two, what are your qualifications and knowledge?",
				"inline": true
			},
			{
				"name": "4️⃣ Your Favorite",
				"value": "What is your favorite thing of any topic. Examples include games, movies, car, tech...",
				"inline": true
			},
			{
				"name": "5️⃣ Personal/Work Builds",
				"value": "No need for massive details, but what projects have you worked on?",
				"inline": true
			},
			{
				"name": "6️⃣ Fun Fact",
				"value": "What would I know if I really knew you?",
				"inline": true
			},
			{
				"name": "7️⃣ Hobbies and Bonus",
				"value": "Fun stuff that might not be caught by other questions. Maybe some hobbies?",
				"inline": true
			}
		]
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "Name/Pronouns",
			"custom_id": "PreInterviewOption_intro_0",
			"disabled": false,
			"emoji": { "name": "1️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Location",
			"custom_id": "PreInterviewOption_intro_1",
			"disabled": false,
			"emoji": { "name": "2️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Career/Academic background",
			"custom_id": "PreInterviewOption_intro_2",
			"disabled": false,
			"emoji": { "name": "3️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Your Favorite",
			"custom_id": "PreInterviewOption_intro_3",
			"disabled": false,
			"emoji": { "name": "4️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Personal/Work Builds",
			"custom_id": "PreInterviewOption_intro_4",
			"disabled": false,
			"emoji": { "name": "5️⃣" },
			"type": 2
		}
	]}, {
		"type": 1,
		"components": [ {
			"style": 1,
			"label": "Fun Fact",
			"custom_id": "PreInterviewOption_intro_5",
			"disabled": false,
			"emoji": { "name": "6️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Hobbies and Bonus",
			"custom_id": "PreInterviewOption_intro_6",
			"disabled": false,
			"emoji": { "name": "7️⃣" },
			"type": 2
		}, {
			"style": 3,
			"label": "Send Embed Message",
			"custom_id": "PreInterviewOption_intro_send",
			"disabled": true,
			"emoji": { "name": "📨" },
			"type": 2
		}, {
			"style": 3,
			"label": "Already Sent Mesage",
			"custom_id": "PreInterviewOption_intro_pass",
			"disabled": false,
			"emoji": { "name": "📬" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_intro_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*               Get Access to Verse Tools              */
/********************************************************/
{
	"embeds": [{
		"title": "Get Access to Verse Tools",
		"color": 4321431,
		"description": "In order to add you to some of our platforms, we will need your usernames, account ids, or sometimes just a preferred email. You may need to create an account for some of these platforms if you do not have one already.",
		"fields": [
			{
				"name": "📧 Preferred Email",
				"value": " This will be used for all platforms that only require an email for an account/access, including the Google Suite, Clickup and Miro. All of the platforms will be discussed further once we can add you to projects.",
				"inline": false
			},
			{
				"name": "<:github:979281491903266826> GitHub Username",
				"value": "We use GitHub for much of our file sharing, usually only recording to Google Drive for larger files like videos. If you are new to GitHub or didn’t know, you can set your display name (different from the username). We would recommend changing your display name to something professional as your Github is a great place to showoff your work in the future!",
				"inline": false
			}
		]
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "Set Email",
			"custom_id": "PreInterviewOption_tools_0",
			"disabled": false,
			"emoji": { "name": "📧" },
			"type": 2
		}, {
			"style": 1,
			"label": "Set GitHub Username",
			"custom_id": "PreInterviewOption_tools_1",
			"disabled": false,
			"emoji": { "id": "979281491903266826", "name": "github" },
			"type": 2
		}, {
			"style": 3,
			"label": "Add to Application",
			"custom_id": "PreInterviewOption_tools_submit",
			"disabled": true,
			"emoji": { "name": "📥" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_tools_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*                  Interview Questions                 */
/********************************************************/
{
	"embeds": [{
		"title": "Interview Questions",
		"color": 4321431,
		"description": "This is a WIP, for now, just submit as completed."
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 3,
			"label": "Completed",
			"custom_id": "PreInterviewOption_cont",
			"disabled": false,
			"emoji": { "name": "☑️" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*                 Set First Interview?                 */
/********************************************************/
{
	"embeds": [{
		"title": "Set First Interview?",
		"color": 4321431,
		"description": "Have you met with Ben Simon-Thomas before? Ben is one of our founders and takes the lead when it comes to first interviews and application screening. If you need to schedule a first interview still, you can compose a message for him here, and he will get back to you to set up an appointment."
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "I have interviewed with Ben already",
			"custom_id": "PreInterviewOption_cont",
			"disabled": false,
			"emoji": { "name": "🤝" },
			"type": 2
		}, {
			"style": 1,
			"label": "I need a first interview",
			"custom_id": "PreInterviewOption_first_cont",
			"disabled": false,
			"emoji": { "name": "📅" },
			"type": 2
		}]
	}]
}
];

const menus = messageContents.map(function([name, content], index):
	[string, (interaction: ButtonInteraction<CacheType>) => Promise<boolean | void>]
{
	if(index < 1)
		return [name, SendMessage.bind({ content: content })];

	return [name, OpenSubFromContext.bind({ content: content })];
});

return [
	...menus,
	[PremainSend.name, PremainSend],
	[ConfPremainCancel.name, ConfPremainCancel],
];
}

async function StartPreInterviewApplication(button: ButtonInteraction<CacheType>)
{
	var content: MessageOptions = {
		embeds: [{
			author: { name: "Application For " + button.user.username },
			footer: {
				icon_url: IconLinks.Edit,
				text: `Editing Application with id '${button.message.id}'`
			}
		}, {
			description: "Loading...",
		}]
	};

	content.embeds[0].fields = content.components.slice(0, -2).flatMap(
		cs => cs.components.map((c: MessageButton) => {
			return {
				name: c.label,
				value: "`Incomplete`",
				inline: false
			};
	}));

	await (button.channel as TextBasedChannel).send(this.content);
}

async function PreChangeMenuFromContext(button: ButtonInteraction<CacheType>): Promise<void>
{
	var msg = await FetchButtonMessage(button);

	var content: ECO = this;

	content[0].author = OnboardingMod.author;

	msg.embeds[msg.embeds.length - 1] = new MessageEmbed(content[0]);
	msg.components = AddButtonsToRow(content[1].map(b => new MessageButton(b)));

	await CustomLock.WaitToHoldKey(msg.id, () => msg.edit({
		embeds: msg.embeds,
		components: msg.components
	}));
}

async function Conf(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button, this);
}

async function PreSubmenuSubmit(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button,
		"Are you sure you want to submit the application? Does everything look good?");
}

/********************************************************/
/*                      Submitted                       */
/********************************************************/
async function PremainSend(button: ButtonInteraction<CacheType>)
{
	const content: MessageOptions = {
		"embeds": [{
			"title": "Submitted",
			"color": 4321431,
			"description": "Thank you for taking time to complete this first part! The admin has been notified, and is working on reviewing for information. Give us some time verify that all tasks were complete and to follow-up with you. After we have accepted your application, we will add you to all for our platforms and you will be messaged with a next part of Onboarding!"
		}]
	}

	if (!await ConfirmButtonInteraction(button,
		"Are you sure you want to submit the application? Does everything look good?"))
		return true;

	
}

async function ConfPremainCancel(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button,
		"Are you sure you want to stop submitting an application? All information will not be posted nor saved.");
}

async function PreInterviewTabs(button: ButtonInteraction<CacheType>)
{
	var pre_msg = await FetchButtonMessage(button);

	var embeds = pre_msg.embeds;
	var comps = pre_msg.components;

	if (button.customId.endsWith("submit"))
	{
		let admin_cont = new MessageEmbed();
		embeds[0].fields.forEach(f => admin_cont.addField(f.name, f.value, false));
		admin_cont.setTitle("Recieved Appliction!");
		admin_cont.setDescription("Application was from user <@" + button.user.id + ">. Information is listed below.!");

		(await FetchTextChannel("985232422847258625")).send({ content: "@everyone", embeds: [admin_cont], components: [{
			type: 1,
			components: [{
				style: 3,
				label: "Accept Application",
				custom_id: "sentapplication_accept",
				disabled: false,
				emoji: { name: "☑️" },
				type: 2
			}, {
				style: 1,
				label: "Schedule a Followup",
				custom_id: "sentapplication_follow",
				disabled: false,
				emoji: { name: "📅" },
				type: 2
			}, {
				style: 4,
				label: "Reject Application",
				custom_id: "sentapplication_reject",
				disabled: false,
				emoji: { name: "⛔" },
				type: 2
			}]
		}]});

		try { pre_msg.delete(); } catch {}
		button.channel.send(OnboardingMod.msgOpts[10]);
		button.deferUpdate();
		return;
	}
	else if (button.customId.endsWith("cancle"))
	{
		ConfirmButtonInteraction(button, "Are you sure you want to stop submitting an application? All information will not be posted or saved.")
			.then(conf => { if (conf) pre_msg.delete().catch(); });
		return;
	}

	button.deferUpdate();

	const option = parseInt(button.customId.charAt(button.customId.length - 1));

	const sent = await button.user.send(OnboardingMod.msgOpts[option + 2]);
	const collector = CreateMCCWithFooterTimer(sent, {time: 600000});

	collector.on("collect", async i => {
		const b = i as ButtonInteraction<CacheType>;
		const id = b.customId;
		const split = b.customId.split("_");

		i.deferUpdate();

		const t = comps[Math.floor(option / 5)].components[option % 5] as MessageButton;

		var markDone = () => {
			t.setStyle("SECONDARY");

			let done = true;
			for (let i = 0; i < 7; i++) {
				done = done && 
					((comps[Math.floor(i / 5)].components[i % 5] as MessageButton).style == "SECONDARY");
			}
			if (done)
				comps[1].components[3].setDisabled(false);
		}

		if (id.endsWith("cont") || id.endsWith("help"))
		{
			if (id.endsWith("help"))
			{
				if (split[1] == "intro")
				{
					var conf = await SendConfirmation(b.channel, { embeds: [{
						title: "Are you sure that you want to cancel?",
						description: "You will loose any information that has already filled!"
					}]});
					if (!conf) return;
				}

				const str = await _GetCancelHelp(collector);
				if (str) EditAppendFieldTitle(embeds[0], `Help! (${t.label})`, `\`${str}\``);
			}
			else {
				if (split[1] == "roles")
				{
					var mem = await FetchMember(b.user.id);
					var content = "";
					if (mem.roles.cache.size < 3)
						content = "Are you sure you completed this task? You look like you don't have any of the project or skill roles. Consider rereading this task as you will not be given permissions until this is done."
					else
						content = "Looks good to us! Just confirm that these are the roles that you selected ('Community' and '@everyone' by default)."
					var desc = mem.roles.cache.map(r => r.name).join("\n");

					var conf = await SendConfirmation(b.channel, { embeds: [{
						author: OnboardingMod.author,
						description: content
					},{
						title: "Your Roles:",
						description: desc
					}] });

					if (!conf) return;
				}
				else if (split[1] == "first")
				{
					var conf = await SendConfirmation(b.channel, { embeds: [{
						description: "Would you like to add a custom message along with your request for a first meeting?",
						author: OnboardingMod.author
					}]});

					var value = "I would like to set up a first interview! ";
					if (conf)
					{
						var answer = await AskTextQuestion({ content: { embeds: [{
							author: OnboardingMod.author,
							description: "What is the message you would like to add? *Send a message here to answer*"
						}]}, channel: b.channel });

						if (!answer) return;
						value += answer.content;
					}

					EditAppendFieldTitle(embeds[0], "Setting First Interview", "`"+ value + "`");
				}
				else if (split[1] == "nick")
				{
					const mem = await FetchMember(b.user.id);
					if (!mem.nickname)
					{
						const conf = await SendConfirmation(b.channel, { embeds: [{
							title: "Are you sure you set a nickname?",
							description: "The Verse Server does not have a nickname registered for you. Are you sure your username `"
								+ mem.user.username + "` is appropriate and identifiable?"
						}]});

						if (!conf) return;
					}
					else
					{
						const conf = await SendConfirmation(b.channel, { embeds: [{
							title: "Is your nickname correct?",
							description: "Verify that your server nickname `"
								+ mem.nickname + "` is correct."
						}]});

						if (!conf) return;
					}
				}

				embeds[0].setFields(
					embeds[0].fields.filter(i => i.name != "Help! (" + t.label + ")"));
			}
			markDone();
			collector.stop("(Pre) Returning to main");
			return;
		}
		else if (split[1] == 'intro'){ try
		{
			if (split[2] == "send")
			{
				let mem = await FetchMember(b.user.id);
				
				let send = new MessageEmbed();
				send.setColor("YELLOW");
				send.setTitle(((mem.nickname) ? mem.nickname : b.user.username) + " Introduction");
				send.setDescription("@here: Meet <@" + mem.id + ">, a new Verse Community Member!");
				sent.embeds[0].fields.forEach(f => {
					let x = f.value.split("\n")[1]
					send.addField(f.name, x.substring(1, x.length - 1), false);
				});

				let conf = SendConfirmation(b.channel, {
					content: "Would you like to sent the following message?:",
					embeds: [send]
				});
				if (!conf) return;

				const introMsg = await (await FetchTextChannel("848805950282268692")).send({ embeds: [send] });
				EditAppendFieldTitle(embeds[0], "Introduction Link", introMsg.url);

				sent.embeds[0].fields.forEach(f =>
					EditAppendFieldTitle(embeds[0], f.name, f.value.split("\n")[1]));

				markDone();
				collector.stop("Sent Intro");
			} else if (split[2] == "pass")
			{
				var URL: string;
				const answer = await AskTextQuestion({ content: { embeds: [{
					author: OnboardingMod.author,
					title: "Enter the Message Link (URL)",
					description: "If you already sent a message in one of the discord channels, you will need to give us the " +
						"message link so we can easily verify. To do this, go to the message and select 'More' " +
						"on the top right (or right click the message). Select 'Copy Message Link', then paste and " + 
						"send that link. *you will be shown a preview before confirming.*",
					image: { url: "https://i.ibb.co/dBcY6dS/Screenshot-2022-06-13-142145.png" }
				}] }, channel: b.channel, validate: async (msg) =>
				{
					try {
						URL = GetLinksFromString(msg.content)[0];
						const introMsg = await FetchMessageFromURL(URL);

						if (introMsg.guildId != process.env.GUILD_ID)
							return "Looks like the message you linked is not within The Verse server. " + 
								"Try reposting that message in the introduction channel, then linking it here.";

						if (!introMsg) return "Unkown error (probably bad message link)";

						var embeds = EmbeddedPreviewMessage(introMsg);
						let conf = await SendConfirmation(b.channel, {
							content: "Is this the correct link?",
							embeds: embeds
						});

						if (conf)
							return null;
						else "Looks like you had the wrong link";
					} catch(e)
					{
						Debug.Error(e);
						return "Message you sent was not a message link";
					};
				}});

				if (answer)
				{
					EditAppendFieldTitle(embeds[0], "Introduction Link", URL);
					markDone();
				}

				collector.stop("Passed on create intro embed.");
				return;
			}
			else
			{
			let embeds = sent.embeds;
			let ind = parseInt(split[2]);
			embeds[0].fields[ind].value = embeds[0].fields[ind].value.split("\n`")[0];

			collector.resetTimer();
			const answer = await AskTextQuestion({
					content: {
						embeds: [{
							title: embeds[0].fields[ind].name,
							description: embeds[0].fields[ind].value
								+ "\n*Send a message  here to fill in the info*",
							author: OnboardingMod.author
						}]
					}, channel: b.user
				});

			if (!answer) return;

			(sent.components[Math.floor(ind/5)].components[ind % 5] as MessageButton).setStyle("SECONDARY");

			if (answer)
				embeds[0].fields[ind].value += "\n`" + answer.content + "`";

			let done = true;
			for (let i = 0; i < 7; i++)
			{
				done = done && (embeds[0].fields[i].value.split("\n`").length > 1);
			}
			if (done)
				sent.components[1].components[2].setDisabled(false);

			sent.edit({ embeds: embeds, components: sent.components });
			collector.resetTimer();
			}
		} catch(e) { Debug.Log("Have an error at intro", e); }}

		if (split[1] == 'tools'){ try
		{
			if (split[2] == "submit")
			{
				sent.embeds[0].fields.forEach(f => {
					let x = embeds[0].fields.find(i => i.name == f.name);
					if (x) x.value = f.value.split("\n")[1];
					else embeds[0].addField(f.name, f.value.split("\n")[1]);
				});

				markDone();
				collector.stop("Submited tools");
				return;
			}
			else
			{
				let embeds = sent.embeds;
				let ind = parseInt(split[2]);
				embeds[0].fields[ind].value = embeds[0].fields[ind].value.split("\n`")[0];

				collector.resetTimer();
				const answer = await AskTextQuestion({
						content: {
							embeds: [{
								description: embeds[0].fields[ind].name + "\n*Send a message  here to fill in the info*",
								author: OnboardingMod.author
							}]
						}, channel: b.user
					});

				if (!answer) return;

				(sent.components[0].components[ind] as MessageButton).setStyle("SECONDARY");

				if (answer)
					embeds[0].fields[ind].value += "\n`" + answer.content + "`";

				let done = true;
				for (let i = 0; i < 2; i++)
					done = done && (embeds[0].fields[i].value.split("\n").length > 1);
				if (done)
					sent.components[0].components[2].setDisabled(false);
	
				sent.edit({ embeds: embeds, components: sent.components });
				collector.resetTimer();
			}
		} catch(e) { Debug.Log("Have an error at information section", e); }}

		if (!collector.ended)
			pre_msg.edit({ embeds: embeds, components: comps }).catch(e => 
				Debug.Error(e));
	});

	collector.on("end", async reason =>
	{
		sent.delete().catch(e => Debug.Log("Could not delete sent message!::", e));

		pre_msg.channel.send({ embeds: embeds, components: comps }).catch(e => Debug.Log("Send message failed!"));
		pre_msg.delete().catch(e => Debug.Log("Could not delete Pre-Interview message (for resend)!::", e));
	});

}