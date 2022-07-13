import { ButtonInteraction, EmbedFieldData, MessageButton, MessageEmbedOptions } from "discord.js";
import { ClientHelper, AskTextQuestion, FetchMessageFromURL, Channels, EmbeddedPreviewMessage, SendConfirmation, Debug, ProfileColumnHeaders, Buttons, FetchMember, ToColor, FetchTextChannel, Authors } from "../../util-lib";
import { GetLinksFromString } from "../LinkCaptureMod";
import { MessageMenu } from "./MessageMenu";

/********************************************************/
/*                  Introduce Yourself                  */
/********************************************************/
const introQuestions: EmbedFieldData[] = [
	{
		name: "1️⃣ Name/Pronouns",
		value: "What is your name? Any nick names? What are your pronouns?",
		inline: true
	},
	{
		name: "2️⃣ Location",
		value: "Where did you grow up? Where you are based now?",
		inline: true
	},
	{
		name: "3️⃣ Career/Academic background",
		value: "In a sentence or two, what are your qualifications and knowledge?",
		inline: true
	},
	{
		name: "4️⃣ Your Favorite",
		value: "What is your favorite thing of any topic. Examples include games, movies, car, tech...",
		inline: true
	},
	{
		name: "5️⃣ Personal/Work Builds",
		value: "No need for massive details, but what projects have you worked on?",
		inline: true
	},
	{
		name: "6️⃣ Fun Fact",
		value: "What would I know if I really knew you?",
		inline: true
	},
	{
		name: "7️⃣ Hobbies and Bonus",
		value: "Fun stuff that might not be caught by other questions. Maybe some hobbies?",
		inline: true
	}
];

const Introduction_MAIN = new MessageMenu(
	"Send Introduction",
	"Introduce yourself to the internal team!",
	 "🎬",
);

const Introduction_SELF = new MessageMenu(
	"Type your own message",
	"Type your own message",
	"📝",
);

ClientHelper.reg_btn("intro_uploadLink", async function (btn: ButtonInteraction)
{
	var URL: string;
	const ans = await AskTextQuestion({
		channel: btn.user,
		content: {
			embeds: [{
				description: "Send your message link here!"
			}]
		},
		validate: async (msg) =>
		{
			try {
				URL = GetLinksFromString(msg.content)[0];
				const introMsg = await FetchMessageFromURL(URL);

				if (introMsg.guildId != process.env.GUILD_ID)
					return "Looks like the message you linked is not within The Verse server. Try re-posting that message in the introduction channel, then linking it here";

				if (introMsg.channelId != Channels.introductions)
					return "Looks like the message you linked is not from the <#" + Channels.introductions + "> channel. Try re-posting that message in the introduction channel, then linking it here";

				if (introMsg.author.id != msg.author.id) return "Looks like the message you linked is not your own message. Try copying a message that you have sent.";

				if (!introMsg) return "Unknown error (probably bad message link)";

				var embeds = EmbeddedPreviewMessage(introMsg);
				let conf = await SendConfirmation(btn.channel, {
					content: "Is this the correct link?",
					embeds: embeds
				});

				if (conf)
					return null;
				else "Looks like you said had the wrong link";
			} catch(e)
			{
				Debug.Error(e);
				return "Message you sent was not a message link";
			};
		}
	});

	if (ans == null)
	{
		Introduction_SELF.Swap(btn);
		return;
	}

	await ProfilesMod.SetUserDataByID(btn.user.id, ProfileColumnHeaders["Introduction Message"], URL);
	PreAppHome._Swap(btn);
});

Introduction_SELF.SetMenu({
	embeds: [{
		title: "Send your message and give us the link!",
		description: "To send a introduction on your own, just go to <#848805950282268692> and send a message answering the following questions. After sending, go to the message and select 'More' on the top right (or right click the message). Select 'Copy Message Link', then paste and send that link.",
		fields: introQuestions,
		image: { url: "https://i.ibb.co/dBcY6dS/Screenshot-2022-06-13-142145.png" }
	}],
	components: AddButtonsToRow([
		Buttons.Back(Introduction_MAIN.Swap),
		Buttons.Empty("intro_uploadLink")
			.setLabel("Upload Intro Link")
			.setStyle("SUCCESS")
			.setEmoji("📤")
	])
});

const Introduction_EMBED = new MessageMenu({
	btn: {
		style: "PRIMARY",
		emoji: "⚒️",
		label: "Build a message with the bot."
	},
});

ClientHelper.reg_btn("IntroductionEmbedModalLoader", (btn) =>
{
	btn.showModal({
		title: "Introduction Builder",
		customId: "introductionmodal",
		components: introQuestions.slice(2).map((iq, index) => ({
			type: 1,
			components: [{
				type: "TEXT_INPUT",
				style: "PARAGRAPH",
				customId: index.toString(),
				minLength: 5,
				maxLength: 1024,
				label: iq.name,
				placeholder: iq.value
			}]
		}))
	});
});

ClientHelper.reg_mdl("introductionmodal", async (mdl) =>
{
	mdl.deferReply();

	const mem = await FetchMember(mdl.user.id);
	const data = await ProfilesMod.GetAllUserDataByID(mdl.user.id);

	var embed: MessageEmbedOptions = {
		color:  ToColor(data[ProfileColumnHeaders.Color]),
		author: { icon_url: mem.displayAvatarURL(), name: mem.displayName },
		title: `1️⃣ I'm ${data[ProfileColumnHeaders["Full Name"]]} (${data[ProfileColumnHeaders.Pronouns]})`,
		description: data[ProfileColumnHeaders.Bio],
		fields: [{
			name: introQuestions[1].name,
			value: data[ProfileColumnHeaders.Location]
		}]
	};

	for (var i = 0; i < 5; i++)
	{
		const val: string = mdl.fields.getTextInputValue(i.toString());
		embed.fields.push({
			name: introQuestions[i + 2].name,
			value: val
		});
	}

	const conf = await SendConfirmation(mdl.user, {
		content: "**Would you like to sent the following embed to the introduction channel?**",
		embeds: [embed]
	});

	if (conf == false)
	{
		Introduction_SELF._Swap(mdl as undefined as ButtonInteraction);
		return;
	}

	const msg = await FetchTextChannel(Channels.introductions).then(ch => ch.send({ embeds: [embed]}))
		.catch(e => null);

	if (msg == null)
	{
		const error: MessageEmbedOptions = {
			author: Authors.Error,
			title: "Could not send intro message!",
			description: "There was an internal error response from discord  after trying to send your message."
		};

		mdl.user.send({ embeds: [error] });
		Debug.Print({ content: "User: <@" + mdl.user.id + ">", embeds: [error] })
		return;
	}

	await ProfilesMod.SetUserDataByID(mdl.user.id, ProfileColumnHeaders["Introduction Message"], msg.url);
	PreAppHome._Swap(mdl as undefined as ButtonInteraction);
});

Introduction_EMBED.SetMenu(async btn =>
{
	const disabled: boolean = await ProfilesMod.GetAllUserDataByID(btn.user.id).then(data =>
	{
		if (!data) return true;

		var done = true;
		personalInfo.forEach(([key, embed, filter]) =>
			done = done && data[key] != undefined && data[key] != "");
		return !done;
	}).catch(e => true);

	return {
		embeds: [{
			author: Authors.Application,
			title: "Have the Bot sent a Message",
			description: (disabled) ?
				"Hit the 'Fill Form' button to answer questions 3️⃣-7️⃣ (you've already answered  1️⃣ & 2️⃣ on your profile). After answering, we will show you a preview before you send!" :
				"Before you can have the bot introduce you, you will need to set the information in your personal profile."
		}],
		components: AddButtonsToRow([
			Buttons.Back(Introduction_MAIN.Swap)
				.setStyle("DANGER")
				.setLabel("Back"),
			Buttons.Empty("IntroductionEmbedModalLoader")
				.setLabel("Fill Form")
				.setStyle("SUCCESS")
				.setDisabled(disabled)
		])
	}
});

Introduction_MAIN.SetMenu(async (btn) =>
{
	const backButton: MessageButton = (btn.component.label?.endsWith("Send Introduction")) ?
		Buttons.Back(PreAppHome.ConfSwap)
			.setStyle("DANGER")
			.setLabel("Back") :
		InfoMenu.SwapButton();

	return {
		embeds: [{
			title: "Introduce Yourself",
			color: 4321431,
			description: "In our discord server, we have a channel named [Introductions](https://discord.com/channels/848804519847526460/848805950282268692) for you to introduce yourself and meet some of the other members. If you would like, you can either write your own message to the channel, or you can fill out the questions here and get your introduction posted in a fancy message (embed). Bonus points for the more creative your answers are!\n*You must answer all questions before you can send the message.*",
			fields: introQuestions
		}],
		components: AddButtonsToRow([
			backButton,
			Introduction_EMBED.SwapButton(),
			Introduction_SELF.SwapButton(),
		])
	}
});

/********************************************************/
/*                   Submitted Page                     */
/********************************************************/
const AppSubmitted = new MessageMenu({
	btn: {
		style: "SUCCESS",
		label: "Submit Application",
		emoji: "☑️",
	},
});

AppSubmitted.SetMenu({
	embeds: [{
		title: "Submitted! 📤",
		color: 4321431,
		description: "Thank you for taking time to complete this first part! The admin has been notified, and is working on reviewing for information. Give us some time verify that all tasks were complete and to follow-up with you. After we have accepted your application, we will add you to all for our platforms and you will be messaged with a next part of Onboarding!"
	}]
});