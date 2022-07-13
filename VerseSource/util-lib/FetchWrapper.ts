import { Message, TextChannel, GuildBasedChannel, GuildMember, Role, Guild, ButtonInteraction, CacheType, Interaction } from "discord.js";
import { ClientHelper } from "./ClientCallbackHelpers";
import { BaseInteraction } from "./types";
import { Debug } from "./util";

export namespace Fetch
{
	export async function Message(channel_id: string, message_id: string, guild_id: string = null): Promise<Message<boolean>>
	{
		return new Promise(async resolve => { try {
			const channel: TextChannel = await Fetch.TextChannel(channel_id, guild_id);
			const msg = await channel.messages.fetch(message_id);
			if (msg)
				resolve(msg);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}

	export function MessageFromURL(msg_url: string): Promise<Message<boolean>>
	{
		return new Promise(async (resolve, reject) =>
		{
			if (!msg_url)
			{
				reject("message-url not provided");
				return;
			}

			const msglink_split = msg_url.match(/[0-9]{10,20}/g);

			var msg: Message<boolean>;

			try
			{
				if (msglink_split && msglink_split.length == 3)
					msg = await Fetch.Message(
						msglink_split[1],
						msglink_split[2],
						msglink_split[0]);

				else if (msglink_split && msglink_split.length == 2 &&
						msg_url.startsWith("https://discord.com/channels/@me/"))
				{
					let channel = await ClientHelper.client.channels.fetch(msglink_split[0]) as TextChannel;
					msg = await channel.messages.fetch(msglink_split[1]);
				}
				else
				{
					reject("Message URL was not valid. Make sure the link is from a message.");
					return;
				}
			} catch
			{
				reject("Message URL looked correct but could not be found.");
				return;
			}

			if (msg)
				resolve(msg);
			else Debug.Error(new Error("Message should never be null! Promise is not going to resolve..."));
		});
	}

	export async function TextChannel(channel_id: string, guild_id: string = null): Promise<TextChannel>
	{
		return new Promise(async resolve => { try {
			const channel = await Fetch.Channel<TextChannel>(channel_id, guild_id);
			if (channel)
				resolve(channel);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}

	export async function Channel<T extends GuildBasedChannel>(channel_id: string, guild_id: string = null): Promise<T>
	{
		return new Promise(async resolve => { try {
			var channel: T;
			if (guild_id) {
				const guild = await Fetch.Guild(guild_id);
				channel = await guild.channels.fetch(channel_id) as T;
			} else channel = await ClientHelper.client.channels.fetch(channel_id) as T;

			if (channel)
				resolve(channel);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}

	export async function Member(user_id: string, guild_id: string = null): Promise<GuildMember>
	{
		return new Promise(async resolve => { try {
			const guild = await Fetch.Guild(guild_id);
			const mem = await guild.members.fetch(user_id);
			//const mem = members.find(m => m.user.id === user_id);

			if (mem)
				resolve(mem);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			resolve(null);
		}});
	}

	export async function Role(role_id: string, guild_id: string = null): Promise<Role>
	{
		return new Promise(async resolve => { try {
			const guild = await Fetch.Guild(guild_id);
			const role = await guild.roles.fetch(role_id);

			if (role)
				resolve(role);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}

	export async function Guild(guild_id: string = null): Promise<Guild>
	{
		return new Promise(async resolve => { try {
			const guild = (guild_id)
				? await ClientHelper.client.guilds.fetch(guild_id)
				: ClientHelper.client.guilds.cache.first();

			if (guild)
				resolve(guild);
			else
				throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}

	export async function InteractionChannel(i: Interaction): Promise<TextChannel>
	{
		return (i.channel ?? await ClientHelper.client.channels.fetch(i.channelId)) as TextChannel;
	}

	export async function ButtonMessage(button: ButtonInteraction<CacheType>): Promise<Message<boolean>>
	{
		return new Promise(async resolve => { try {
			var pre_msg: Message<boolean>;

			if (button.channel)
				pre_msg = await button.channel.messages.fetch(button.message.id);
			else
			{
				const channel = await ClientHelper.client.channels.fetch(button.channelId) as TextChannel;
				pre_msg = await channel.messages.fetch(button.message.id);
			}
			if (pre_msg)
				resolve(pre_msg);
			else throw new Error("Fetch is returning null.");
		} catch(e)
		{
			Debug.Error(e);
			return null;
		}});
	}
}