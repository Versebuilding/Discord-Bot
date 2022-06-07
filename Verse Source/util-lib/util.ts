import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import { Message, Interaction, Client, TextChannel, GuildMember, CacheType, CommandInteraction, GuildBasedChannel, Role, Guild, ButtonInteraction } from "discord.js";
import { DiscordModule } from "../Discord-Modules";

export class GlobalVariables
{
	static client: Client;
}

export class Debug
{
	private static log = "## Beginning of log ##\n";

	static Log(...args: any[])
	{
		var out = "";
		if (args.length == 0) out = "\n";
		else for (let i = 0; i < args.length; i++)
		{
			const str = JSON.stringify(args[i]);
			out += str.substring(1, str.length - 1) + "\n";
		}

		this.log += out;

		console.log(out.substring(0, out.length - 1));

		const trimto = this.log.length - 7000;
		if (trimto > 0)
		{
			this.log = this.log.substring(trimto, this.log.length);
		}
	}

	static GetLog() { return this.log; }
}

export function PreviewMessage(msg: Message<boolean>, len: number = 50): string
{
	return msg.content.substring(0, msg.content.length > len ? len : msg.content.length);
}

/**
 * Initializes and Syncs the commands with given modules with discord.
 * 
 * @param mods Modules that should be included with this bot
 */
export function SetupCommands(mods: DiscordModule[]): void
{
	let commands: SlashCommandBuilder[] = [];
	mods.forEach(m => m.GetCommands().forEach(cmd => commands.push(cmd)));

	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

	(async () => {
	try {
		Debug.Log('Started refreshing application (/) commands.');

		await rest.put(
		Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
		{ body: commands },
		);

		Debug.Log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
	})();
}

export function CommandNameFilter(interaction: Interaction, cmd: string, callback: (i: CommandInteraction<CacheType>) => void)
{
	if (interaction.isCommand() && interaction.commandName === cmd)
		callback(interaction);
}

export function ButtonNameFilter(interaction: Interaction, cid: string, callback: (i: ButtonInteraction<CacheType>) => void)
{
	if (interaction.isButton() && interaction.customId === cid)
		callback(interaction);
}

export async function FetchMessage(channel_id: string, message_id: string, guild_id: string = null): Promise<Message<boolean>>
{
	const channel: TextChannel = await FetchTextChannel(channel_id, guild_id);

	if (channel) // If is text channel
		return await channel.messages.fetch(message_id);
	else
	{
		console.log("channel could not be fetched for the FetchMessage");
		return null;
	}
}

export async function FetchTextChannel(channel_id: string, guild_id: string = null): Promise<TextChannel>
{
	return (await FetchChannel<TextChannel>(channel_id, guild_id));
}

export async function FetchChannel<T extends GuildBasedChannel>(channel_id: string, guild_id: string = null): Promise<T>
{
	const guild = await FetchGuild(guild_id);
	const channel: T = await guild.channels.cache.get(channel_id) as T;
	return channel;
}

export async function FetchMember(user_id: string, guild_id: string = null): Promise<GuildMember>
{
	const guild = await FetchGuild(guild_id);
	const members = await guild.members.fetch();
	return members.find(m => m.user.id === user_id);
}

export async function FetchRole(role_id: string, guild_id: string = null): Promise<Role>
{
	const guild = await FetchGuild(guild_id);
	return guild.roles.cache.get(role_id);
}

export async function FetchGuild(guild_id: string = null): Promise<Guild>
{
	return await GlobalVariables.client.guilds.fetch(
		(guild_id) ? guild_id : process.env.GUILD_ID
	);
}