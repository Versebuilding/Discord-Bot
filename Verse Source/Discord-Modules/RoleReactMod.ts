import { CacheType, Client, CommandInteraction, DiscordAPIError, EmbedFieldData, MessageActionRow, MessageButton, MessageEmbed, MessageReaction, PartialMessageReaction, PartialUser, User, Util } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscordModule } from "./DiscordModule";
import { CommandNameFilter, Debug, FetchMember, FetchMessage, FetchRole, FetchTextChannel, SheetsWrapper } from "../util-lib";
import { ChannelType } from "discord-api-types/v9";

interface RoleMessage {
	readonly msg_id: string;
	readonly channel_id: string;
	roles: ReactionRole[];
}

interface ReactionRole { id: string, emoji_id: string, desc: string }

export class RoleReactMod extends DiscordModule
{
	roleMessages: RoleMessage[];
	client: Client;

	ParseMessageID(msg_id: string): { index: number; error: string; }
	{
		var index = parseInt(msg_id);
		var error: string = null;

		if (isNaN(index))
			error = "Message id (" + msg_id + ") is NaN.";

		else if (msg_id.length < 10)
		{
			if (index < 0)
				index += this.roleMessages.length;

			if (index < 0 || index >= this.roleMessages.length)
				error = "Message id (" + msg_id + ") is assumed to be a message index, but index is out of bounds.";
		}
		else 
		{
			index = this.roleMessages.findIndex(rm => rm.msg_id === msg_id);

			if (index == -1)
				error = "Message with id '" + msg_id + "' could not be found.";
		}

		return { index, error };
	}

	async LoadCacheMessages(values: string[][])
	{
		this.roleMessages = [/*{ msg_id: "N/A", channel_id: "N/A", roles: [] }*/];

		for await (const row of values)
		{
			Debug.Log("Parsing row: ", row);
			if (row[0].startsWith("#")) continue;

			let rm: RoleMessage = { msg_id: row[0], channel_id: row[1], roles: [] };

			for (let i = 2; i < row.length; i += 3)
				rm.roles.push({ id: row[i], emoji_id: row[i+1], desc: row[i+2]});

			const msgobj = await FetchMessage(rm.channel_id, rm.msg_id);
			if (msgobj == null) Debug.Log("RoleMessage could not be loaded! row:: ", row);

			this.roleMessages.push(rm);
		}
	}

	async OnReaction(inReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser)
	{
		const reaction: MessageReaction = (inReaction.partial) ?
			await inReaction.fetch() : inReaction as MessageReaction;

		const index: number = this.roleMessages.findIndex(rm => rm.msg_id === reaction.message.id);
		const rm: RoleMessage = this.roleMessages[index];

		if (!rm)
		{
			Debug.Log("-> Reaction on message is not a rolemessage and is skipping");
			return
		}

		if (user.id === this.client.user.id)
		{
			Debug.Log("-> This bot has reacted to a cashed message and is skipping...");
			return;
		}

		const member = await FetchMember(user.id);
		console.log(reaction.emoji);

		const role_pair = rm.roles.find(r => {
			const raw = Util.resolvePartialEmoji(r.emoji_id);
			if (raw.name && raw.id)
				return raw.name === reaction.emoji.name && raw.id === reaction.emoji.id;
			else if (raw.name)
				return raw.name === reaction.emoji.name
			else return raw.id === reaction.emoji.id;
		});

		if (member && role_pair)
		{
			const role = await FetchRole(role_pair.id);

			// Toggle
			if (member.roles.cache.some(r => r.id === role.id))
			{
				Debug.Log(`-> Removing role '${role.name}' from user '${member.nickname}'`);
				member.roles.remove(role);
			}
			else 
			{
				Debug.Log(`-> Adding role '${role.name}' to user '${member.nickname}'`);
				member.roles.add(role);
			}

			this.UpdateRoleMessage(index);
		}
		else
			Debug.Log("-> Failed to get member or the role matching the emoji.");

		reaction.users.remove(user.id);
	}

	async OnCMD_RoleMessage(interaction: CommandInteraction<CacheType>)
	{
		Debug.Log("-> Running interaction as role-message command...");

		const channel = interaction.options.getChannel("send-channel");
		const embed = interaction.options.getString("embed");

		var embedObj = new MessageEmbed(JSON.parse(embed));
		embedObj.setFields([]);

		// Might not be needed
		const targetChannel = await FetchTextChannel(channel.id);
		const sentMessage = await targetChannel.send({ embeds: [embedObj] });

		SheetsWrapper.AppendRow({ values: [sentMessage.id, targetChannel.id] })
		this.roleMessages.push({ msg_id: sentMessage.id, channel_id: targetChannel.id, roles: [] });

		interaction.reply({ content: "Message sent and cached!", ephemeral: true });
	}

	async OnCMD_AddRole(interaction: CommandInteraction<CacheType>)
	{
		const msg_id = interaction.options.getString("msg-id");
		const role = interaction.options.getRole("role");
		const emoji = interaction.options.getString("emoji");
		const description = interaction.options.getString("description");

		Debug.Log("-> Running interaction as add-role command " +
			`{ mgs_id: ${msg_id}, role: ${role.name}, emoji: ${emoji}, desc: ${description} }`);

		const {index, error} = this.ParseMessageID(msg_id);

		if (error)
		{
			interaction.reply({ content: error, ephemeral: true });
			return;
		}

		const rm = this.roleMessages[index];

		// FetchMessage(this.client, process.env.GUILD_ID, rm.channel_id, rm.msg_id).then(m =>
		// 	m.react(emoji));

		const reactRole = { emoji_id: emoji, id: role.id, desc: description };

		// Update or add react role to RoleMessage
		const existing = rm.roles.findIndex(r => r.id == role.id);
		if (existing != -1)
			rm.roles[existing] = reactRole;
		else rm.roles.push(reactRole);

		console.log("New: ", rm, "Old: ", this.roleMessages[index]);

		this.UpdateRoleMessage(index);
		this.UpdateRoleMessageDatabase(index);

		interaction.reply({ content: "Message updated and saved!", ephemeral: true });
	}

	async UpdateRoleMessageDatabase(index: number)
	{
		const rm = this.roleMessages[index];

		var values: string[] = [
			rm.msg_id,
			rm.channel_id
		];

		rm.roles.forEach(r => values = values.concat(r.id, r.emoji_id, r.desc));

		console.log(values);
		console.log(await SheetsWrapper.UpdateRow({ values: values, row: index + 2 }));
	}

	async OnCMD_RefreshRoleMessages(interaction: CommandInteraction<CacheType>)
	{
		await this.LoadCacheMessages((await SheetsWrapper.ReadAll()).values);
		this.roleMessages.forEach((_, i) => this.UpdateRoleMessage(i, true));

		interaction.reply({ content: "All messages are up to date!", ephemeral: true });
	}

	async UpdateRoleMessage(index: number, full: boolean = false): Promise<boolean>
	{
		const rm = this.roleMessages[index];

		const message = await FetchMessage(rm.channel_id, rm.msg_id);

		if (message == null)
		{
			Debug.Log("ERROR: Could not fetch message with id '" + rm.msg_id + "' for updating role messages!");
			return;
		}

		const embed = message.embeds[0];

		if (full) await message.reactions.removeAll();

		var feilds: EmbedFieldData[] = [];

		const guild = await this.client.guilds.fetch(process.env.GUILD_ID);
		await guild.members.fetch();

		var comps: MessageActionRow[] = [];
		var count = 5;

		rm.roles.forEach(async r => {
			if (count > 4)
			{
				comps.push(new MessageActionRow());
				count = 0;
			}

			var role = guild.roles.cache.get(r.id);

			feilds.push({
				name: role.name + " " + r.emoji_id,
				value: r.desc + "\n" + role.members.map(m => `<@${m.user.id}>`).join("\n"),
				inline: true
			});

			comps[comps.length - 1].addComponents(
				new MessageButton()
					.setCustomId(JSON.stringify(r))
					.setLabel(role.name)
					.setEmoji(r.emoji_id)
					.setStyle("SECONDARY")
			);

			(async () => {
				try { await message.react(r.emoji_id); }
				catch (error)
				{
					var api_error = error as DiscordAPIError;
					if (api_error && api_error.message == "Unknown Emoji")
						Debug.Log("Message react failed due to unknown emoji: '" + r.emoji_id + "'");
					else
						Debug.Log("Message react failed: " + error.message);
				}
			})();

			count++;
		});

		embed.setFields(feilds);

		message.edit({ embeds: [embed], components: comps });
		return true;
	}

	async Initialize(client: Client<boolean>)
	{
		this.client = client;

		let dataPromise = SheetsWrapper.ReadAll();

		client.on("ready", async() => {
			await this.LoadCacheMessages((await dataPromise).values)
			this.roleMessages.forEach((_, i) => this.UpdateRoleMessage(i, true));
		});

		client.on("messageReactionAdd", this.OnReaction.bind(this));

		client.on("interactionCreate", async i =>
			CommandNameFilter(i, "role-message", this.OnCMD_RoleMessage.bind(this)));
		client.on("interactionCreate", async i =>
			CommandNameFilter(i, "add-role", this.OnCMD_AddRole.bind(this)));
		client.on("interactionCreate", async i =>
			CommandNameFilter(i, "reload-role-messages", this.OnCMD_RefreshRoleMessages.bind(this)));
	}

	GetCommands(): SlashCommandBuilder[]
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