import { SlashCommandBuilder } from "@discordjs/builders";
import { ClientEvents, Interaction, PermissionResolvable, Awaitable } from "discord.js";
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

		return async (...args) => {
			for await (const f of valid)
				if (!await f(...args))
					return false;
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

	export function PermAuth(perms: PermissionResolvable[], and: boolean = true): Delegate<[Interaction], boolean>
	{
		return async (i) => {
			const mem = await Fetch.Member(i.user.id);

			var result = and;
			for (const perm of perms)
				result = and ?
					result && mem.permissions.has(perm) :
					result || mem.permissions.has(perm)

			return result;
		};
	}

	export function RoleAuth(role_ids: string[], and: boolean = true): Delegate<[Interaction], boolean>
	{
		return async (i) => {
			const mem = await Fetch.Member(i.user.id);

			var result = and;
			for (const role of role_ids)
				result = and ?
					result && mem.roles.cache.has(role) :
					result || mem.roles.cache.has(role);

			return result;
		};
	}

	/** Contant pointer to the "Pass" funciton, servers purposes of: 
	 * Avoiding creating a new nameless function for each instance.
	 */
	function _Pass(): boolean { return true };
	export function Pass(): Delegate<[], boolean> { return _Pass; };
	
}