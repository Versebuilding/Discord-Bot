import { CacheType, CommandInteraction, Message, MessageButton, MessageEmbedOptions } from "discord.js";
import { Authors, Buttons, ClientHelper, COMMON_REGEXPS, CreateMCCWithFooterTimer, CustomLock, Fetch, GetLinksFromString, GetNumberEmoji, MessageReactionCallback, RemoveReactionFromMsg, SheetsHelpers } from "../util-lib"
import { SlashCommandBuilder } from "@discordjs/builders";
import { Debug } from "../Logging";

ClientHelper.on("messageCreate", OnMessage,
	m => !m.author.bot && m.channel.type != "DM"
);

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("upload-link-from-message")
		.setDescription("Pulls all URLs from a message and lets you post to the MDD")
		.addStringOption(option =>
			option.setName("message-link")
				.setDescription("The link to the target message.")
				.setRequired(true)),
	OnCMD_UploadFromMessage);

async function OnMessage(msg: Message<boolean>)
{
	if (msg.author.bot) return;

	var links = GetLinksFromString(msg.content);

	if (links && links.length > 0)
	{
		Debug.Log("'" + links.length + "' links found in message.");

		MessageReactionCallback(msg, "🔗", async () => {
			RemoveReactionFromMsg(msg, "🔗");
			CreateInteractableLinkReply(msg, links);
		}, 600000);
	}
	else
		Debug.Log("No links found in message.");
}

async function CreateInteractableLinkReply(msg: Message<boolean>, links: RegExpMatchArray)
{
	const channelName = (await Fetch.Channel(msg.channelId)).name;

	var comps = Buttons.ButtonsToRows(...links.map((l, i) => new MessageButton()
		.setCustomId(i.toString())
		.setLabel("Post")
		.setEmoji(GetNumberEmoji(i))
		.setStyle("SECONDARY")));
	var content = links.map((l, i) => GetNumberEmoji(i)+ ": " + l).join("\n");

	var embed: MessageEmbedOptions = {
		color: "DARK_GREEN",
		title: "Save Links to Master Directory Doc?",
		description: content,
		author: Authors.LinkCap,
	};

	var replym = await msg.reply({ embeds: [embed], components: comps });
	var collector = CreateMCCWithFooterTimer(replym, { max: links.length, time: 300000});

	var nums: number[] = [];

	collector.on("collect", i => {
		Debug.Log("Collected button reaction on message");
		try { if (i.isButton())
		{
			nums.push(parseInt(i.customId));
			(comps[Math.floor(parseInt(i.customId) / 5)]
				.components[parseInt(i.customId) % 5] as MessageButton)
					.setDisabled(true)
					.setStyle("SUCCESS");

			SheetsHelpers.AppendRow({ values: [
				channelName, "",
				`=HYPERLINK("${msg.url}","${msg.author.username}")`,
				i.user.username,
				msg.content,
				links[i.customId]
			], sheetname: "Chat Links", docID: "1UHZBH9bjRuR1dnUsH6UcVL-KpYPTBp00AD4L_9SW5ZI" });

			collector.resetTimer();
			CustomLock.WaitToHoldKey(replym.id, () => 
				replym.edit({ embeds: [embed], components: comps }))
			.then(() => {
				i.reply({ embeds: [{
					title: "Link was posted",
					description: "Check out the links posted in [Chat Links > Bot Dump](https://docs.google.com/spreadsheets/d/1UHZBH9bjRuR1dnUsH6UcVL-KpYPTBp00AD4L_9SW5ZI/edit#gid=1566372611&range=A13:G13) on the Master Directory Document",
					author: Authors.LinkCap
				}], ephemeral: true });
			});
		}} catch {
			i.reply({ content: "The was an issue posting the link to the sheets!", ephemeral: true });
		}
	});

	collector.on("end", async function(_) {
		try
		{
			if (nums.length > 0)
			{
				let content = "Links Posted: ";
				nums.forEach(n => content += GetNumberEmoji(n) + " ");
				await CustomLock.WaitToHoldKey(replym.id, () => (replym).edit({ embeds: [{
					color: "DARK_GREEN",
					description: content +
					"\nCheck out the links posted in [Chat Links > Bot Dump](https://docs.google.com/spreadsheets/d/1UHZBH9bjRuR1dnUsH6UcVL-KpYPTBp00AD4L_9SW5ZI/edit#gid=1566372611&range=A13:G13)",
					author: Authors.LinkCap,
				}], components: [] }));

				Debug.Log("Interactions have expired and message has been edited");
			}
			else
			{
				await CustomLock.WaitToHoldKey(replym.id, () => replym.delete());
				Debug.Log("Interactions have expired and message has been deleted");
			}
		}
		catch
		{
			Debug.Log("Could not dispose link upload message correctly.");
		}
	});
}

async function OnCMD_UploadFromMessage(i: CommandInteraction<CacheType>)
{
	const msglink = i.options.getString("message-link");

	Fetch.MessageFromURL(msglink).then(msg =>
	{
		i.reply({ embeds: [{
			title: "Done!",
			color: "GREEN",
			description: "Replied to the provided message",
			author: Authors.LinkCap
		}], ephemeral: true });
	
		CreateInteractableLinkReply(msg, GetLinksFromString(msg.content));

	}).catch(e =>
	{
		i.reply({ embeds: [{
			title: "Error!",
			color: "RED",
			description: e.toString(),
			author: Authors.LinkCap
		}], ephemeral: true });
	})
}