import { CacheType, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscordModule } from "./DiscordModule";
import { Authors, ClientHelper, Debug, EmbeddedPreviewMessage, FetchMessage, FetchMessageFromURL, FetchTextChannel, PreviewMessage } from "../util-lib";

async function OnCMD_Ping(interaction: CommandInteraction<CacheType>)
{
	await interaction.reply({ embeds: [{ description: 'Pong!', author: Authors.Core }], ephemeral: true });
}

async function OnCMD_ListRoleMembers(interaction: CommandInteraction<CacheType>)
{
	let content = "";

		const role = interaction.options.getRole('role');

		// Only used to update list of users.
		await interaction.guild.members.fetch();

		const users = interaction.guild.roles.cache.get(role.id).members.map(m => m.user.id);
		users.forEach(u => content += `<@${u}>, `);

		if (content == "") content = "No members were found.";
		else content = content.substring(0, content.length - 2);
		await interaction.reply({ embeds: [{ description: `<@&${role.id}>-> ${content}`, author: Authors.Core }], ephemeral: true });
}

async function OnCMD_SendEmbed(interaction: CommandInteraction<CacheType>)
{
	const channel = interaction.options.getChannel("channel");
	const embed = interaction.options.getString("embed");
	const tempBtn = interaction.options.getString("button");

	var embedObj: MessageEmbed[] = [];
	if (embed) try { embedObj.push(new MessageEmbed(JSON.parse(embed))); }
	catch (error)
	{
		console.log(error);
		interaction.reply({ embeds: [{ description: "Failed to parse the embed. Check the formating!", author: Authors.Core }, {
			title: "Embed:",
			description: embed
		}], ephemeral: true });
		return;
	}

	var comps: MessageActionRow[] = [];
	if (tempBtn) try { comps.push(new MessageActionRow().addComponents(new MessageButton(JSON.parse(tempBtn)))); }
	catch (error)
	{
		console.log(error);
		interaction.reply({ embeds: [{ description: "Failed to parse the embed. Check the formating!", author: Authors.Core }, {
			title: "Button:",
			description: tempBtn
		}], ephemeral: true});
		return;
	}

	var channelObj :TextChannel;
	try { channelObj = await FetchTextChannel(channel.id); }
	catch { interaction.reply({embeds: [{ description: "Failed to find channel!", author: Authors.Core }], 
		ephemeral: true});
		return;
	}

	try
	{
		await channelObj.send({ embeds: embedObj, components: comps });
		interaction.reply({ embeds: [{ description: "Message has been sent!", author: Authors.Core }], ephemeral: true});
	}
	catch (error)
	{
		console.log(error);
		Debug.Log("Failed to send message!", error);
		interaction.reply({ embeds: [{ description: "Could not sent message due to Discord API error!", author: Authors.Core }], ephemeral: true});
	}
}

async function OnCMD_EditEmbed(interaction: CommandInteraction<CacheType>)
{
	const channel = interaction.options.getChannel("channel");
	const msgid = interaction.options.getString("msg-id");
	const embed = interaction.options.getString("embed");

	var embedObj: MessageEmbed[] = [];
	if (embed) try { embedObj.push(new MessageEmbed(JSON.parse(embed))); }
	catch (error)
	{
		console.log(error);
		interaction.reply({ content: "Failed to parse the embed. Check the formating!", embeds: [{
			title: "Embed:",
			description: embed
		}], ephemeral: true});
		return;
	}

	var message :Message<boolean>;
	try { message = await FetchMessage(channel.id, msgid); }
	catch { interaction.reply({ content: "Failed to find message!", 
		ephemeral: true});
		return;
	}

	if (message.author.id != ClientHelper.client.user.id)
	{
		interaction.reply({ content: "Cannot edit message that is not from this bot! (author of message is <@" + message.author.id + ">", ephemeral: true});
		return;
	}

	try
	{
		await message.edit({ embeds: embedObj });
		interaction.reply({ content: "Message has been editted!", ephemeral: true});
	}
	catch (error)
	{
		Debug.Log("Failed to edit message!", error);
		interaction.reply({ content: "Could not edit message due to Discord API error!", ephemeral: true});
	}
}

async function OnCMD_MessagePreview(interaction: CommandInteraction<CacheType>)
{
	const msg_link = interaction.options.getString("message-link");

	try {
		var msg = await FetchMessageFromURL(msg_link);
		if (!msg) throw new Error();

		interaction.reply({ content: "Here is that message: ", embeds: EmbeddedPreviewMessage(msg), ephemeral: true });
	}
	catch (e) { interaction.reply({ content: "Message link was not found.", ephemeral: true }); }
}

async function OnCMD_AddButton(interaction: CommandInteraction<CacheType>)
{
	const channel = interaction.options.getChannel("channel");
	const msgid = interaction.options.getString("msg-id");
	const customId = interaction.options.getString("custom-id");
	const Emoji = interaction.options.getString("emoji");
	const Label = interaction.options.getString("label");
	const Style = interaction.options.getString("style");
	const URL = interaction.options.getString("url");
}

export class CoreMod extends DiscordModule
{
	Initialize()
	{
		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('ping')
				.setDescription('Replies with Pong!'),
			OnCMD_Ping
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('listmembers')
				.setDescription('Converts any times in given text into Discord timezone commands!')
				.addRoleOption(option =>
					option.setName('role')
						.setDescription('The input to be parsed for times')
						.setRequired(true)),
			OnCMD_ListRoleMembers
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('show-message')
				.setDescription('Shows a preview of a message link on discord')
				.addStringOption(option =>
					option.setName('message-link')
						.setDescription('The message link/URL to the target message.')
						.setRequired(true)),
			OnCMD_MessagePreview
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('send-embed')
				.setDescription('Sends an embedded message!')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('Channel to send the message.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('embed')
						.setDescription('Embed to send with message.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('button')
						.setDescription('Button to add to message.')
						.setRequired(false)),
			OnCMD_SendEmbed
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('edit-embed')
				.setDescription('Edits an embedded message!')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('Channel with target message.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('msg-id')
						.setDescription('The message that should be editted.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('embed')
						.setDescription('Embed to add to message.')
						.setRequired(true)),
			OnCMD_EditEmbed
		);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName('add-button')
				.setDescription('Edits an embedded message!')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('Channel with target message.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('msg-id')
						.setDescription('The message that should be editted.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('custom-id')
						.setDescription('ID of the button.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('label')
						.setDescription('Text that shows on the button.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('emoji')
						.setDescription('Emoji that is shown to the left of the button.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('style')
						.setDescription('The look of the button')
						.addChoices(
							{ value: "PRIMARY", name: "PRIMARY" })
						.setRequired(false))
				.addStringOption(option =>
					option.setName('url')
						.setDescription('URL that can be click on the right side of the button')
						.setRequired(false)),
			OnCMD_AddButton
		);
	}
}