import { SlashCommandBuilder } from "@discordjs/builders";
import { ClientEvents, Interaction, PermissionResolvable, Awaitable, Message, PartialMessage, VoiceChannel, Channel, GuildBasedChannel, NonThreadGuildBasedChannel, GuildMember } from "discord.js";
import { Debug } from "../Logging";
import { Roles } from "./VerseMacros";
import { Fetch } from "./FetchWrapper";
import { Delegate } from "./types";

export namespace Filters
{
	export function Merge<K extends keyof ClientEvents>(...filters: (Delegate<ClientEvents[K], boolean> | null)[])
		: Delegate<ClientEvents[K], boolean>
	{
		const valid = filters.filter(f => f != null) as Delegate<ClientEvents[K], boolean>[];

		if (valid.length == 1)
		{
			if (valid[0])
				return valid[0];
			else return Filters.Pass();
		}

		if (valid.length == 0)
			return Filters.Pass();

		return async (...args) =>
		{
			var count = 0;
			for (const f of valid)
			{
				const result = await f(...args);
				if (!result)
					return false;
			}
			return true;
		};
	}

	function _IsButton(i: Interaction): boolean { return i.isButton(); }
	export function Button(id: string | null = null, starts: boolean = false): (i: Interaction) => boolean
	{
		if (starts && id)
			return (i) => (i.isButton()) && i.customId.startsWith(id);
		else if (id)
			return (i) => (i.isButton()) && i.customId == id;
		else return _IsButton;
	}

	function _IsModal(i: Interaction): boolean { return i.isModalSubmit(); }
	export function Modal(id: string | null = null, starts: boolean = false): (i: Interaction) => boolean
	{
		if (starts && id)
			return (i) => (i.isModalSubmit()) && i.customId.startsWith(id);
		else if (id)
			return (i) =>(i.isModalSubmit()) && i.customId == id;
		else return _IsModal;
	}

	function _IsCommand(i: Interaction): boolean { return i.isCommand(); }
	export function Command(cmd: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | null = null)
		: (i: Interaction) => boolean
	{
		if (cmd)
			return (i) => i.isCommand() && i.commandName == cmd.name;
		else return _IsCommand;
	}

	export function PermAuth(perms: PermissionResolvable[], and: boolean = true): Delegate<[Interaction | Message], boolean>
	{
		return async (i) => {
			const mem = await Fetch.Member((i as Interaction)?.user?.id ?? (i as Message)?.author?.id);

			var result = and;
			for (const perm of perms)
				result = and ?
					result && mem.permissions.has(perm) :
					result || mem.permissions.has(perm)

			return result;
		};
	}

	export function RoleAuth(role_ids: string[], and: boolean = true): Delegate<[Interaction | Message], boolean>
	{
		return async (i) =>
		{
			const mem = await Fetch.Member((i as Interaction)?.user?.id ?? (i as Message)?.author?.id);

			var result = and;
			for (const role of role_ids)
				result = and ?
					result && mem.roles.cache.has(role) :
					result || mem.roles.cache.has(role);

			return result;
		};
	}

	/**
	 * Filters for all matching channels (failing those that do not match).
	 * @param channel_ids The valid channel IDs for which this filter passes. This a an OR filter as and would always be false.
	 * @returns Boolean if the current interaction/message is in one of the channels.
	 */
	export function Channels(channel_ids: string[]): Delegate<[Interaction | Message | PartialMessage], boolean>
	{
		return async (i) =>
		{
			for (const channel of channel_ids)
				if (i.channelId == channel)
					return true;

			return false;
		};
	}

	export function iIsBot(): (i: Interaction) => boolean { return (i) => i.user.bot; }
	export function mIsBot(): (m: Message) => boolean { return (m) => m.author.bot; }
	export function iIsNotBot(): (i: Interaction) => boolean { return (i) => !i.user.bot; }
	export function mIsNotBot(): (m: Message) => boolean { return (m) => !m.author.bot; }

	export async function UserIsCreator(uid: string): Promise<boolean>
	{
		return await Fetch.Member(uid).then(m => m && m.roles.cache.has(Roles.Creator.id));
	}

	export function iCreatorAuth(): Delegate<[Interaction], boolean> { return _iCreatorAuth; }
	export function iModeratorAuth(): Delegate<[Interaction], boolean> { return _iModeratorAuth; }
	async function _iCreatorAuth(interaction: Interaction)
	{
		const mem = await Fetch.Member(interaction.user.id);
		return mem.roles.cache.has(Roles.Creator.id);
	}
	async function _iModeratorAuth(interaction: Interaction)
	{
		const mem = await Fetch.Member(interaction.user.id);
		return mem.roles.cache.has(Roles.Moderator.id);
	}

	export function mCreatorAuth(): Delegate<[Message | PartialMessage], boolean> { return _mCreatorAuth; }
	export function mModeratorAuth(): Delegate<[Message | PartialMessage], boolean> { return _mModeratorAuth; }
	async function _mCreatorAuth(interaction: Message | PartialMessage)
	{
		const mem = await Fetch.Member(interaction.author.id);
		return mem.roles.cache.has(Roles.Creator.id);
	}
	async function _mModeratorAuth(interaction: Message | PartialMessage)
	{
		const mem = await Fetch.Member(interaction.author.id);
		return mem.roles.cache.has(Roles.Moderator.id);
	}

	/** Constant pointer to the "Pass" function, servers purposes of: 
	 * Avoiding creating a new nameless function for each instance.
	 */
	function _Pass(): boolean { return true };
	export function Pass(): Delegate<[], boolean> { return _Pass; };

	export function IsEventVC(c: NonThreadGuildBasedChannel): boolean
	{
		return c.parent?.id == "865236289456832563" && // Jam Area
			c.type == "GUILD_VOICE" &&
			!c.name.startsWith("Jam Room")
	}
	
}