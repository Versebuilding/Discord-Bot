import { Awaitable, MessageButton, MessageOptions } from "discord.js";
import { Authors, Buttons, Delegate, ClientHelper, FetchMember, Debug, Channels, FetchTextChannel, BaseInteraction, IconLinks, Roles, FuncAble, ResolveFuncAble, FetchMessage, CloseMessage } from "../../util-lib";
import { isProfileSetup } from "../ProfilesMod";
import { CommandMenus, HelpMenus } from "./MenuDeclarations";

const backToInfo = HelpMenus.VerseCreatorApplication.RegSwap(HelpMenus.InfoMenu);
const toProfileSetup = HelpMenus.VerseCreatorApplication.RegSwap(CommandMenus.profileSetup);

// TODO: Change to Verse Creators that cannot apply.
HelpMenus.VerseCreatorApplication.allowed = async (i) =>
{
	const mem = await FetchMember(i.user.id);
	return !mem.roles.cache.has(Roles.Copper.id);
};

const preAppTasks: {
	name: string,
	desc: string,
	isDone: Delegate<[BaseInteraction], boolean>,
	goto: FuncAble<MessageButton, [BaseInteraction]>
}[] = [
	{
		name: "Setup Verse Profile",
		desc: "Build a profile containing information about you.",
		isDone: (i) => isProfileSetup(i.user.id),
		goto: (i) => CommandMenus.profileSetup.AsyncGetButtonWithId(toProfileSetup, i),
	},
	{
		name: "Add Yourself to Skills and Projects",
		desc: "Let others see your skills and interests.",
		isDone: async (i) => {
			var mem = await FetchMember(i.user.id);
			return (mem.roles.cache.size > 2)
		},
		goto: Buttons.Link({
			url: "https://discord.com/channels/848804519847526460/848810485397979186",
			label: "Role Assign",
			emoji: "⚙️",
		}),
	}
];

const appQuestions: { name: string, value: string }[] =
[
	{
		name: "🤝 Why do you want to join The Verse?",
		value: "Wanting Experience? Advocate for wellbeing? Interested in specific project?"
	},
	{
		// name: "🌇 What does a metaverse look like to you?",
		// value: "How would you describe it? What purpose does it serve?"
		name: "🤹 What skills do you have to contribute?",
		value: "Marketing, Web Dev, Narrative, Art, PM, Game Dev..."
	},
	{
		name: "📅 When can you start/end an internship?",
		value: "There are no limits. Some stay for a few months and others have been contributing for years."
	},
	{
		name: "⌛ How many hours weekly can you work?",
		value: "Versers can work anywhere from 5-40 hours/week. We support OPT and academic credit internships."
	},
	{
		name: "👩‍💼 Have you interviewed w/ Ben Simon-Thomas?",
		value: "If YES, when/where did you meet? If NO, have you meet/contacted Ben Simon-Thomas?"
	},
];

// Modal cannot fit more than 6 questions.
Debug.Assert(appQuestions.length < 6);

const appSubmitId = ClientHelper.reg_mdl("Verse-Creator-Application|Submit", async mdl =>
{
	const [mem, channel] = await Promise.all([
		FetchMember(mdl.user.id),
		FetchTextChannel(Channels.applications)
	]);

	const msg: MessageOptions = { embeds: [{
		author: Authors.Application,
		title: "Verse Application Received: " + mem.displayName,
		thumbnail: { url: mem.displayAvatarURL() },
		description: "<@" + mem.user.id + "> just submitted their Verse Application.",
		footer: { text: "There will eventually be actions on this message (accept, add to tools, send onboarding...)."}
	}]};

	msg.embeds[0].fields = appQuestions.map((q, index) =>
	{
		return {
			name: q.name,
			value: mdl.fields.getTextInputValue(index.toString()),
			inline: false,
		}
	});

	await channel.send(msg);

	mdl.reply({ embeds: [{
		author: Authors.Application,
		title: "Application Submitted!",
		description: "Someone from the admin team will be looking at your profile and getting in contact with you soon.",
		thumbnail: { url: "https://www.svgheart.com/wp-content/uploads/2021/11/fireworks-4th-of-july-new-year-free-svg-file-SvgHeart.Com.png" },
	}] });
});

const baseMessage: MessageOptions =
{
	embeds: [{
		author: Authors.Application,
		title: HelpMenus.VerseCreatorApplication.Title(),
		description: "Have you been hired onto The Verse? Or are you looking to **become a new member**? Our application is just **" + appQuestions.length + " questions**.\n*In order to open the form, you will need to make sure the following steps are complete:*",
		//thumbnail: { url: "https://clipart.world/wp-content/uploads/2020/12/Paint-Splatter-clipart-3.png" },
	}]
}

const preappOpenFrom = ClientHelper.reg_btn("PreApp|open-form", async (btn) =>
{
	await Promise.all([
		CloseMessage(btn),
		btn.showModal({
			title: "Verse Creator Application",
			customId: appSubmitId,
			components: appQuestions.map((iq, index) => ({
				type: 1,
				components: [{
					type: "TEXT_INPUT",
					style: "PARAGRAPH",
					customId: index.toString(),
					minLength: 5,
					maxLength: 4000,
					label: iq.name,
					placeholder: iq.value
				}]
			}))
		}),
	]).catch(async e =>
	{
		Debug.LogError("There was an error opening the Modal for Verse Creator Application.", e);
		await HelpMenus.InfoMenu.Open(btn);
	});
});

HelpMenus.VerseCreatorApplication.menu = async (interaction) =>
{
	var doneCount = preAppTasks.length;
	var gotoButtons: MessageButton[] = [];

	baseMessage.embeds[0].fields = await Promise.all(preAppTasks.map(async task =>
	{
		let done = await task.isDone(interaction);
		if (done) doneCount--;

		const btn = await ResolveFuncAble(task.goto, interaction);
		gotoButtons.push(btn);

		return {
			name: (done ? "✅ " : "🛑 ") + task.name,
			value: (done ? "*Done* - " : "*TODO* - ") + task.desc,
			inline: false,
		}
	}));

	baseMessage.embeds[0].footer = {
		iconURL: (doneCount != 0) ? IconLinks.Error : IconLinks.Check,
		text: (doneCount != 0) ? "You have not completed " + doneCount + " of the items above!" : "You are good to go! Hit 'Open Application' to fill and send an application!",
	};

	baseMessage.components = Buttons.ButtonsToRows(
		Buttons.Back(backToInfo),
		Buttons.Empty(preappOpenFrom)
			.setLabel("Open Application")
			.setEmoji("📝")
			.setStyle("SUCCESS")
			.setDisabled(doneCount != 0),
	);

	baseMessage.components.push(...Buttons.ButtonsToRows(
		...await Promise.all(gotoButtons)
	));

	return baseMessage;
};