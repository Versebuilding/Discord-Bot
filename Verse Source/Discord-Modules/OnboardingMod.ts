import { ButtonInteraction, CacheType, Collector, InteractionCollector, Message, MessageButton, MessageComponentInteraction, MessageEmbed, MessageOptions, TextBasedChannel, TextChannel } from "discord.js";
import { AskTextQuestion, ButtonCallbackMap, ClientCallbackData, ConfirmButtonInteraction, CreateMCCWithFooterTimer, CustomLock, Debug, EditAppendFieldTitle, EmbeddedPreviewMessage, FetchButtonMessage, FetchMember, FetchMessage, FetchMessageFromURL, FetchTextChannel, GetComponentFromMessage, IconLinks, SendConfirmation, SheetsWrapper } from "../util-lib";
import { DiscordModule } from "./DiscordModule";
import * as onboarding_messages from "../../data/Onboarding.json"
import { GetLinksFromString } from "./LinkCaptureMod";
import { ButtonMapGenerators } from "./OnboardingButtons";


export interface MenuData
{
	name: string;
	content: MessageOptions;
}

export class OnboardingMod extends DiscordModule
{
	static readonly author = {
		icon_url: IconLinks.Application,
		name: "Onboarding Application"
	};

	static msgOpts;

	Initialize()
	{
		OnboardingMod.msgOpts = onboarding_messages as MessageOptions[];
		var callbackData = new ClientCallbackData();

		var idTable = new ButtonCallbackMap("Onboarding");

		ButtonMapGenerators.forEach(gen => gen(idTable));

		callbackData.addMap(idTable);

		// callbackData.addButton({
		// 	filter: i => i.customId.startsWith(ModPrelabel),
		// 	execute: OnBtn_OnboardingBtnFilter
		// });

		// callbackData.addClientReady({ execute: async () =>
		// 	Debug.Print((onboarding_messages as MessageOptions[])[0])
		// });

		callbackData.addButton({ customId: "StartOnboarding", execute: async b => {
			Debug.Log("Starting an Onboarding interaction!");
			b.reply({ content: "Thank you for considering joining The Verse. Please look at the message that I have sent you to get started.", ephemeral: true });
			b.user.send(OnboardingMod.msgOpts[0]);
		}});

		callbackData.addButton({ customId: "BeginApplication", execute: async b => {
			b.user.send(OnboardingMod.msgOpts[1]);
			FetchButtonMessage(b).then(m => m.edit({ embeds: m.embeds, components: [] }));
			b.deferUpdate();
		}});

		callbackData.addButton({ filter: i => i.customId.startsWith("PreInterview_"), execute: PreInterviewTabs });
		callbackData.addButton({ filter: i => i.customId.startsWith("PostInterview_"), execute: PostInterviewTabs });
		callbackData.addButton({ customId: "sentapplication_accept", execute: ApplicationAccept });
		callbackData.addButton({ customId: "sentapplication_follow", execute: ApplicationFollow });
		callbackData.addButton({ customId: "sentapplication_reject", execute: ApplicationReject });
		callbackData.addButton({ customId: "SetFollowupDate", execute: SetFollowupDate });
		callbackData.addButton({ customId: "BeginPostApplication", execute: i =>
			i.reply({ content: "Sorry, this is not implelemted yet!", ephemeral: true })
		});

		return callbackData;
	}
}

async function DisableButton(button: ButtonInteraction<CacheType>)
{
	const msg = await FetchButtonMessage(button);
	GetComponentFromMessage(msg, button.customId).setDisabled(true);
	await CustomLock.WaitToHoldKey(msg.id, () => msg.edit({ components: msg.components }));
}

async function CloseMessage(button: ButtonInteraction<CacheType>)
{
	try {
		let msg = await FetchButtonMessage(button);
		await CustomLock.WaitToHoldKey(msg.id, () => msg.delete());
		return true;
	} catch {
		Debug.Log("Message already deleted. Probably two buttons clicked at once. Breaking.");
	}
}

export async function SendMessage(button: ButtonInteraction<CacheType>): Promise<void>
{
	await (button.channel as TextBasedChannel).send(this.content);
}

async function SetFollowupDate(button: ButtonInteraction<CacheType>)
{
	try
	{
		const msg = await FetchButtonMessage(button);

		const answer = await AskTextQuestion({channel: button.channel, content: { embeds: [{
			title: "📅 Message with a few times and dates",
			description: "Let us know what times will work for you by sending a message here. The format does not matter, any you will be able to confirm the message."
		}] } });

		if (!answer) return;

		const mem = await FetchMember(button.user.id);

		const conf = await SendConfirmation(button.channel, {
			content: "Does the following message look right?",
			embeds: [{
				description: ">>> I would like to set up a second interview. " + answer.content,
				footer: {
					iconURL: button.user.avatarURL(),
					text: "Sent from " + button.user.username + " (AKA " + mem.nickname + ")"
				}
			}]
		});

		(await FetchTextChannel("985232422847258625")).send({
			content: "<@" + button.user.id + "> has sent dates for their follow-up. Check your calendar message them with a meeting date!"
		});

		msg.edit({ embeds: [{
			color: "BLUE",
			title: "Admin Notified!",
			description: "Thank you for setting up a follow up with the admin at The Verse. They have been notified of the appointment."
		}], components: [] });
		button.deferUpdate();

	} catch {};
}

async function ApplicationAccept(button: ButtonInteraction<CacheType>)
{
	const msg = await FetchMessage(button.channelId, button.message.id);
	const user = msg.embeds[0].description.match(/<@[0-9]{15,22}>/g)[0];

	let conf = await ConfirmButtonInteraction(button, "Are you sure that you want to give " + user + " access to Verse Creator content?" +
		" This will also upload their application to the Google Sheets.");
	if (!conf) return;

	button.reply({ content: "This is not ready yet! Please do not accept people (-Nev)."});
	return;
	FetchMember(user.substring(2, user.length - 1)).then(async mem =>
	{
		mem.send(OnboardingMod.msgOpts[13]);
		var cols = await SheetsWrapper.ReadRow(1, "Applications");
		let len = cols.length;

		let values: string[] = [];
		cols.forEach(_ => values.push(""));

		values[0] = mem.nickname;

		msg.embeds[0].fields.forEach(f => {
			let index = cols.findIndex(c => c == f.name);
			if (index == -1)
			{
				cols.push(f.name);
				values.push(f.value);
			}
			else values[index] = (f.value);
		});

		if (len != cols.length)
			await SheetsWrapper.UpdateRow({ values: cols, sheetname: "Applications", row: 1 })
		await SheetsWrapper.AppendRow( { values: values, sheetname: "Applications" });

		button.channel.send({ content: "Post Application was sent by <@" + button.user.id + ">. User " + user + " is now a Verse Creator" });
	});
}

async function ApplicationFollow(button: ButtonInteraction<CacheType>)
{
	const msg = await FetchMessage(button.channelId, button.message.id);
	const user = msg.embeds[0].description.match(/<@[0-9]{15,22}>/g)[0];

	ConfirmButtonInteraction(button, "Are you sure that you want to request a follow-up with " + user + "?").then((conf) =>
	{
		if (!conf) return;
		FetchMember(user.substring(2, user.length - 1)).then(mem =>
		{
			mem.send(OnboardingMod.msgOpts[12]);

			button.channel.send({ content: "Follow-up request was sent and addressed to <@" + button.user.id + ">" });
		});
	});
}

async function ApplicationReject(button: ButtonInteraction<CacheType>)
{
	const msg = await FetchMessage(button.channelId, button.message.id);
	const user = msg.embeds[0].description.match(/<@[0-9]{15,22}>/g)[0];

	ConfirmButtonInteraction(button, "Are you sure that you want to decline the application from " + user + "?").then((conf) =>
	{
		if (!conf) return;
		FetchMember(user.substring(2, user.length - 1)).then(mem =>
		{
			mem.send(OnboardingMod.msgOpts[11]);

			button.channel.send({ content: "Application for user " + user + " was Denied." });
		});
	});
}

async function _GetCancelHelp(collector: InteractionCollector<MessageComponentInteraction<CacheType>>)
	: Promise<string>
{
	const channel = await FetchTextChannel(collector.channelId);

	try {
		const conf = await SendConfirmation(channel, { embeds: [{
			description: "Do you need need help? Select 'Yes' to type a message and skip this task. 'No' will just close this menu.",
			author: OnboardingMod.author
		}]});

		if (!conf)
		{
			collector.stop();
			return;
		}

		collector.resetTimer();
		const answer = await AskTextQuestion({
			content: {
				embeds: [{
					description: "What do you need help with? Type as a message and I will add it to the application.",
					author: OnboardingMod.author
				}]
			}, channel: channel
		});

		return answer ? answer.content : null;

	} catch(e) { Debug.Log("Have an error at help", e); }

	return null;
}

async function PostInterviewTabs(button: ButtonInteraction<CacheType>)
{
	var post_msg = await FetchButtonMessage(button);
	var embeds = post_msg.embeds;
	var comps = post_msg.components;

	// cmd at 0 is "PostInterview"
	const cmds = button.customId.split("_");

	if (cmds[1] == "submit")
	{

	}

	for (let cmdIndex = 1; cmdIndex < cmds.length; cmdIndex++)
	{
		const id = cmds[cmdIndex];

	}
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