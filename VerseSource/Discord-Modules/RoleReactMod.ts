import { ButtonInteraction, CacheType, CommandInteraction, EmbedFieldData, Message, MessageActionRow, MessageButton, MessageEmbed, Util } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Authors, Buttons, Channels, ClientHelper, Fetch, Filters, SheetsHelpers } from "../util-lib";
import { ChannelType } from "discord-api-types/v9";
import { Debug } from "../Logging";

interface RoleMessage {
	readonly msg_id: string;
	readonly channel_id: string;
	roles: ReactionRole[];
}

interface ReactionRole { id: string, emoji_id: string, desc: string }

var roleMessages: RoleMessage[] = [];


ClientHelper.on("ready", async() => {
	let dataPromise = SheetsHelpers.ReadAll();
	await LoadCacheMessages((await dataPromise).values)
	roleMessages.forEach((_, i) => UpdateRoleMessage(i));
});

const cmds = GetCommands();
ClientHelper.reg_cmd(cmds[0], OnCMD_RoleMessage);
ClientHelper.reg_cmd(cmds[1], OnCMD_AddRole);
ClientHelper.reg_cmd(cmds[2], OnCMD_RefreshRoleMessages);

ClientHelper.on("interactionCreate", OnBtn_RoleReact,
	b => b.isButton() &&
		(roleMessages.findIndex(rm => rm.msg_id === b.message.id) != -1 &&
		b.customId.match(/[0-9]{20,50}/g) &&
		b.user.id !== ClientHelper.client.user.id)
);

ClientHelper.reg_btn("getSelfMessage", OnBtn_getSelfMessage);
ClientHelper.reg_btn("getUsersMessage", OnBtn_getUsersMessage);


function ParseMessageID(msg_id: string): { index: number; error: string; }
{
	var index = parseInt(msg_id);
	var error: string = null;

	if (isNaN(index))
		error = "Message id (" + msg_id + ") is NaN.";

	else if (msg_id.length < 10)
	{
		if (index < 0)
			index += roleMessages.length;

		if (index < 0 || index >= roleMessages.length)
			error = "Message id (" + msg_id + ") is assumed to be a message index, but index is out of bounds.";
	}
	else 
	{
		index = roleMessages.findIndex(rm => rm.msg_id === msg_id);

		if (index == -1)
			error = "Message with id '" + msg_id + "' could not be found.";
	}

	return { index, error };
}

async function LoadCacheMessages(values: string[][])
{
	roleMessages = [/*{ msg_id: "N/A", channel_id: "N/A", roles: [] }*/];

	for await (const row of values)
	{
		if (row[0].startsWith("#")) continue;

		let rm: RoleMessage = { msg_id: row[0], channel_id: row[1], roles: [] };

		for (let i = 2; i < row.length; i += 3)
			rm.roles.push({ id: row[i], emoji_id: row[i+1], desc: row[i+2]});

		const msgobj = await Fetch.Message(rm.channel_id, rm.msg_id);
		//if (msgobj == null) Debug.Log("RoleMessage could not be loaded! row:: ", row);
		if (msgobj == null) continue;
		roleMessages.push(rm);
	}

	Debug.Log(`Loadded ${roleMessages.length} out of ${values.length - 1} rows.`);
}



async function OnBtn_getUsersMessage(button: ButtonInteraction<CacheType>)
{
	const index: number = roleMessages.findIndex(rm => rm.msg_id === button.message.id);
	const rm: RoleMessage = roleMessages[index];

	const message = await Fetch.Message(rm.channel_id, rm.msg_id);

	if (message == null)
	{
		Debug.Log("ERROR: Could not fetch message with id '" + rm.msg_id + "' for updating role messages!");
		return;
	}

	var msg = await GetUpdatedMessage(message, rm, true, false);
	msg["ephemeral"] = true;

	button.reply(msg);
	return;
}

async function OnBtn_getSelfMessage(button: ButtonInteraction<CacheType>)
{
	const member = await Fetch.Member(button.user.id);
	var content = `Remember, you can always view yours or anyones roles by clicking on a username/icon while in the server.\nYour Roles: `
		+ member.roles.cache.map(r => `<@&${r.id}>`).join(", ");
	button.reply({ content: content, ephemeral: true });
}

async function OnBtn_RoleReact(button: ButtonInteraction<CacheType>)
{
	Debug.Log("Role React!");
	const index: number = roleMessages.findIndex(rm => rm.msg_id === button.message.id);
	const rm: RoleMessage = roleMessages[index];

	const member = await Fetch.Member(button.user.id);

	const role_pair = rm.roles.find(r => {
		const raw = Util.resolvePartialEmoji(r.emoji_id);
		if (raw.name && raw.id)
			return raw.name === button.component.emoji.name && raw.id === button.component.emoji.id;
		else if (raw.name)
			return raw.name === button.component.emoji.name
		else return raw.id === button.component.emoji.id;
	});

	if (member && role_pair)
	{
		const role = await Fetch.Role(role_pair.id);

		// Toggle
		if (member.roles.cache.some(r => r.id === role.id))
		{
			await member.roles.remove(role);
			Debug.Log(`-> Removing role '${role.name}' from user '${member.nickname ? member.nickname : member.user.username}'`);
			await Fetch.TextChannel(Channels.bot_log).then(channel => 
				channel.send({ embeds: [{
					color: "RED",
					description: `<@${member.id}> removed self from <@&${role.id}> via role button`,
					author: Authors.RoleAssign
				}]})
			);

			button.reply({ content: "You have been removed to the role '" + role.name + "'", ephemeral: true});
		}
		else 
		{
			await member.roles.add(role);
			Debug.Log(`-> Adding role '${role.name}' to user '${member.nickname ? member.nickname : member.user.username}'`);

			await Fetch.TextChannel(Channels.bot_log).then(channel => 
				channel.send({ embeds: [{
					color: "GREEN",
					description: `<@${member.id}> added self to <@&${role.id}> via role button.`,
					author: Authors.RoleAssign
				}]})
			);

			button.reply({ content: "You have been added to the role '" + role.name + "'", ephemeral: true});
		}

		UpdateRoleMessage(index);
	}
	else
		Debug.Log("-> Failed to get member or the role matching the emoji.");
}

async function OnCMD_RoleMessage(interaction: CommandInteraction<CacheType>)
{
	Debug.Log("-> Running interaction as role-message command...");

	const channel = interaction.options.getChannel("send-channel");
	const embed = interaction.options.getString("embed");

	var embedObj
	try { embedObj = new MessageEmbed(JSON.parse(embed));}
	catch {
		interaction.reply({ content: "Failed to parse the embed. Check the formating!", embeds: [{
			title: "Embed:",
			description: embed
		}], ephemeral: true});
		return;
	}

	embedObj.setFields([]);

	// Might not be needed
	const targetChannel = await Fetch.TextChannel(channel.id);
	const sentMessage = await targetChannel.send({ embeds: [embedObj] });

	SheetsHelpers.AppendRow({ values: [sentMessage.id, targetChannel.id] })
	roleMessages.push({ msg_id: sentMessage.id, channel_id: targetChannel.id, roles: [] });

	interaction.reply({ content: "Message sent and cached!", ephemeral: true });
}

async function OnCMD_AddRole(interaction: CommandInteraction<CacheType>)
{
	const msg_id = interaction.options.getString("msg-id");
	const role = interaction.options.getRole("role");
	const emoji = interaction.options.getString("emoji");
	const description = interaction.options.getString("description");

	Debug.Log("-> Running interaction as add-role command " +
		`{ mgs_id: ${msg_id}, role: ${role.name}, emoji: ${emoji}, desc: ${description} }`);

	const {index, error} = ParseMessageID(msg_id);

	if (error)
	{
		interaction.reply({ content: error, ephemeral: true });
		return;
	}

	const rm = roleMessages[index];

	// FetchMessage(GlobaleVariables.client, process.env.GUILD_ID, rm.channel_id, rm.msg_id).then(m =>
	// 	m.react(emoji));

	const reactRole = { emoji_id: emoji, id: role.id, desc: description };

	// Update or add react role to RoleMessage
	const existing = rm.roles.findIndex(r => r.id == role.id);
	if (existing != -1)
		rm.roles[existing] = reactRole;
	else rm.roles.push(reactRole);

	Debug.Log("New: ", rm, "Old: ", roleMessages[index]);

	UpdateRoleMessage(index);
	UpdateRoleMessageDatabase(index);

	interaction.reply({ content: "Message updated and saved!", ephemeral: true });
}

async function UpdateRoleMessageDatabase(index: number)
{
	const rm = roleMessages[index];

	var values: string[] = [
		rm.msg_id,
		rm.channel_id
	];

	rm.roles.forEach(r => values = values.concat(r.id, r.emoji_id, r.desc));

	await SheetsHelpers.UpdateRow({ values: values, row: index + 2 });
	Debug.Log("Role Database has been updated at row " + index + 2);
}

async function OnCMD_RefreshRoleMessages(interaction: CommandInteraction<CacheType>)
{
	await LoadCacheMessages((await SheetsHelpers.ReadAll()).values);
	roleMessages.forEach((_, i) => UpdateRoleMessage(i));

	interaction.reply({ content: "All messages are up to date!", ephemeral: true });
}

async function GetUpdatedMessage(message: Message<boolean>, rm: RoleMessage,
	includeUsers: boolean = false, includeBtns: boolean = false)
{
	const embed = message.embeds[0];

	var feilds: EmbedFieldData[] = [];

	const guild = await ClientHelper.client.guilds.fetch(process.env.GUILD_ID);
	await guild.members.fetch();


	var btns: MessageButton[] = [];
	rm.roles.forEach(async r => {

		var role = guild.roles.cache.get(r.id);

		if (includeUsers)
		{
			feilds.push({
				name: role.name + " (" + role.members.size + ") " + r.emoji_id,
				value: r.desc + "\n" + role.members.map(m => `<@${m.user.id}>`).join("\n"),
				inline: true
			});
		}
		else feilds.push({
			name: role.name + " (" + role.members.size + ") " + r.emoji_id,
			value: r.desc,
			inline: true
		});

		if (includeBtns) btns.push(
			new MessageButton()
				.setCustomId(rm.msg_id + r.id)
				.setLabel(role.name)
				.setEmoji(r.emoji_id)
				.setStyle("SECONDARY")
		);
	});

	var comps = Buttons.ButtonsToLimitedRows(
		btns,
		Buttons.GetBestRowLength(btns.length)
	);

	if (includeBtns)
	{
		comps.push(...Buttons.ButtonsToRows(
			new MessageButton()
				.setCustomId("getUsersMessage")
				.setLabel("Show All Roles")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("getSelfMessage")
				.setLabel("Show Your Roles")
				.setStyle("PRIMARY")
		));
	}

	embed.setFields(feilds);

	return {
		embeds: [embed],
		components: comps
	};
}

async function UpdateRoleMessage(index: number): Promise<boolean>
{
	const rm = roleMessages[index];

	const message = await Fetch.Message(rm.channel_id, rm.msg_id);

	if (message == null)
	{
		Debug.Log("ERROR: Could not fetch message with id '" + rm.msg_id + "' for updating role messages!");
		return;
	}

	await message.edit(await GetUpdatedMessage(message, rm, false, true)).catch(Debug.LogError);
	return true;
}

function GetCommands(): SlashCommandBuilder[]
{
	let cmds: SlashCommandBuilder[] = [];
	for (let i = 0; i < 3; i++) cmds.push(new SlashCommandBuilder());

	cmds[0].setName('role-message')
		.setDescription('Creates a new role message.')
		.addChannelOption(option => option
			.setName('send-channel')
			.addChannelTypes(ChannelType.GuildText)
			.setDescription('Channel where this new message should be sent')
			.setRequired(true))
		.addStringOption(option => option
			.setName('embed')
			.setDescription('Embed that will form the message. Note fields will be overridden')
			.setRequired(true));

	cmds[1].setName('add-role')
		.setDescription('Adds a role to a role message (can be used to update).')
		.addStringOption(option => option
			.setName('msg-id')
			.setDescription('The target message. Must be a role message id OR sheet row index (-1 is last message).')
			.setRequired(true))
		.addRoleOption(option => option
			.setName('role')
			.setDescription('The target role to be added.')
			.setRequired(true))
		.addStringOption(option => option
			.setName('emoji')
			.setDescription('The reaction emoji for message.')
			.setRequired(true))
		.addStringOption(option => option
			.setName('description')
			.setDescription('The description of the role that will be put into the embed')
			.setRequired(true));

	cmds[2].setName('reload-role-messages')
		.setDescription('refreshes role messages, syncing reactions and users with database');

	return cmds;
}

// client.on("messageReactionAdd", async function(reaction, user)
// {
// 	if (user.id === client.user.id)
// 		return;
	
// 	const msg = !reaction.message.author ?
// 		await reaction.message.fetch() :
// 		reaction.message;

// 	if (msg.author.id !== client.user.id)
// 		return;
// });