import { Routes } from "discord-api-types/v9";
import { CommandInteraction, ButtonInteraction, ClientEvents, Awaitable, Client, Interaction, Intents, ModalSubmitInteraction, Message } from "discord.js";
import { CustomLock } from "./AsyncLock";
import { Filters } from "./Filters";
import { BaseInteraction, Delegate, SlashCommand } from "./types";
import * as assert from "assert";
import { Debug } from "../Logging";
import { Authors } from "./VerseMacros";

export interface CallbackOptions<K extends keyof ClientEvents>
{
	filter: Delegate<ClientEvents[K], boolean>,
	execute: Delegate<ClientEvents[K]>,
}

interface ClientEventListeners<K extends keyof ClientEvents>
{
	key: K,
	numOfCalls: number,
	values: CallbackOptions<K>[];
}

async function FilterListeners<K extends keyof ClientEvents>(listeners: ClientEventListeners<K>, ...args: ClientEvents[K]):
	Promise<CallbackOptions<K>[]>
{
	var result: CallbackOptions<K>[] = [];
	for await (const callback of listeners.values)
	{
		if (!callback.filter || await callback.filter(...args))
			result.push(callback);
	}
	return result;
}

export class ClientHelper
{
	static async Login(token: string)
	{
		await ClientHelper.client.login(token);
		ClientHelper.loggedIn = true;

		// Save space as this is only needed for validation.
		ClientHelper.commandNames = null;
		ClientHelper.buttonIds = null;
		ClientHelper.modalIds = null;
	}

	static loggedIn: boolean = false;
	static crashed: boolean = false;
	static client: Client = null;
	static numberOfUses: number = 0;
	private static listeners: ClientEventListeners<any>[] = [];

	static slashCommands: SlashCommand[] = [];

	static on<K extends keyof ClientEvents>(
		event: K,
		execute: Delegate<ClientEvents[K]>,
		filter?: Delegate<ClientEvents[K], boolean>,
	) {
		let options: CallbackOptions<K> = {
			execute: execute,
			filter: Filters.Merge(filter)
		}

		let listener = ClientHelper.listeners.find(l => l.key == event);
		if (listener) listener.values.push(options);
		else
			ClientHelper.BindEvent(event).values.push(options);
	}

	private static commandNames = new Set<string>();
	private static buttonIds = new Set<string>();
	private static modalIds = new Set<string>();

	static reg_cmd(
		cmd: SlashCommand | null,
		execute: Delegate<[CommandInteraction]>,
		filter?: Delegate<[CommandInteraction], boolean>
	) {
		assert(!ClientHelper.loggedIn);

		if (cmd != null) {
			ClientHelper.slashCommands.push(cmd);
			assert(!ClientHelper.commandNames.has(cmd.name),
				"ClientHelper.reg_cmd() already has registered command with name '" + cmd.name + "'");
			ClientHelper.commandNames.add(cmd.name);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as ((i: Interaction) => Awaitable<void>),
			Filters.Merge(Filters.Command(cmd), filter),
		);
	}

	static reg_btn<T extends string | null>(
		key: T,
		execute: Delegate<[ButtonInteraction]>,
		filter?: Delegate<[ButtonInteraction], boolean>,
		starts: boolean = false,
	) {
		assert(!ClientHelper.loggedIn);

		if (key) {
			assert(!ClientHelper.buttonIds.has(key),
				"ClientHelper.reg_btn() already has registered button with id '" + key + "'");
			ClientHelper.buttonIds.add(key);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as Delegate<[Interaction]>,
			Filters.Merge(Filters.Button(key, starts), filter)
		);

		return key;
	}

	static reg_mdl<T extends string | null>(
		key: T,
		execute: Delegate<[ModalSubmitInteraction]>,
		filter?: Delegate<[ModalSubmitInteraction], boolean>,
		starts: boolean = false,
	) {
		assert(!ClientHelper.loggedIn);

		if (key) {
			assert(!ClientHelper.modalIds.has(key),
				"ClientHelper.reg_mdl() already has registered button with id '" + key + "'");
			ClientHelper.modalIds.add(key);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as Delegate<[Interaction]>,
			Filters.Merge(Filters.Modal(key, starts), filter)
		);

		return key;
	}

	static BindEvent<K extends keyof ClientEvents>(x: K): ClientEventListeners<K>
	{
		let listeners: ClientEventListeners<K> = { key: x, numOfCalls: 0, values: [] };
		ClientHelper.listeners.push(listeners);

		if (x == "interactionCreate") 
			ClientHelper.client.on(x, async (...args) =>
			{
				if (ClientHelper.crashed) return;

				ClientHelper.OnUse(listeners);

				let interaction = args[0] as Interaction;

				if ((interaction.isButton() || interaction.isModalSubmit()))
				{
					const btnKey = interaction.message?.id ?? interaction.customId;
					if (CustomLock.TryAcquireKey(btnKey))
					{
						try
						{
							const callbacks = await FilterListeners(listeners, ...args);
							for await (const callback of callbacks)
								await callback.execute(...args);

						} catch (err) {
							Debug.LogError(err);
							if (!interaction.replied && !interaction.deferred)
								await interaction.reply({
									embeds: [{
										author: Authors.Error,
										description: "There was an internal error!",
									}],
									ephemeral: true
								}).catch(() =>
									(interaction as BaseInteraction).followUp({
										embeds: [{
											author: Authors.Error,
											description: "There was an internal error!",
										}],
										ephemeral: true
									})).catch(Debug.LogError);
						}
	
						if (!interaction.replied && !interaction.deferred)
						{
							Debug.LogWarning("Button/Modal with id '" + interaction.customId + "' did not have a response.");
							await interaction.reply({
								embeds: [{
									author: Authors.Error,
									description: "Button/Modal does not have a response! This is most likely due to a bug with the bot, but could also be a privilege error! If you think this is a bug, please reach out to the moderators on discord.",
								}],
								ephemeral: true
							}).catch(e =>
							{
								Debug.LogError("The button was replied/deferred but did not await the response.");
							});
						}

						CustomLock.ReleaseKey(btnKey);
					}
					else interaction.reply({
						embeds: [{
							author: Authors.Error,
							description: "Button is already trying to respond (try again)!",
						}],
						ephemeral: true
					});
				}
				else if (interaction.isCommand())
				{
					const callbacks = await FilterListeners(listeners, ...args);
					for await (const callback of callbacks)
						await callback.execute(...args);
					
					if (!interaction.replied && !interaction.deferred)
					{
						Debug.LogWarning("Command with name '" + interaction.commandName + "' did not have a response.");
						await interaction.reply({
							embeds: [{
								author: Authors.Error,
								description: "You do not have permissions to access this command! *If you think this is a bug, please reach out to the moderators on discord.*",
							}],
							ephemeral: true
						}).catch(e =>
						{
							Debug.LogError("The command was replied/deferred but did not await the response.");
						});
					}
				}
				else
				{
					Debug.LogError("Create Interaction not compatible with implemented interactions: ", interaction);
				}
				Debug.LogEvent(x + " ended");
			});
		else
			ClientHelper.client.on(x, async (...args) =>
			{
				if (ClientHelper.crashed) return;
				ClientHelper.OnUse(listeners);
				const callbacks = await FilterListeners(listeners, ...args);
				for await (const callback of callbacks)
					await callback.execute(...args);

				if (x == "messageCreate" && (args[0] as Message).author.bot)
					return;

				Debug.LogEvent(x + " ended");
			});

		return listeners;
	}

	public static GetUses<K extends keyof ClientEvents>(key: K | null): number
	{
		if (key)
			return ClientHelper.listeners.find(l => l.key == key)?.numOfCalls ?? 0;
		else
			return ClientHelper.numberOfUses;
	}

	public static GetAllUses(): [keyof ClientEvents, number][]
	{
		return ClientHelper.listeners.map(l => [l.key, l.numOfCalls]);
	}
	
	public static readonly onlineEvents: (keyof ClientEvents)[] = [
		"messageCreate",
		"messageUpdate",
		"interactionCreate",
		"messageDelete",
		"voiceStateUpdate",
		"guildMemberAdd",
		"guildMemberRemove",
		"threadCreate",
	];

	private static OnUse<K extends keyof ClientEvents>(listeners: ClientEventListeners<K>)
	{
		listeners.numOfCalls++;
		ClientHelper.numberOfUses++;

		if (ClientHelper.nextUseListeners.length != 0)
		{
			if (ClientHelper.onlineEvents.find(k => k == listeners.key))
			{
				ClientHelper.nextUseListeners.forEach(c => c(listeners.key));
				ClientHelper.nextUseListeners = [];
			}
		}
	}

	static ForceCrash()
	{
		if (ClientHelper.crashed) return;

		ClientHelper.crashed = true;
		ClientHelper.crashListeners.forEach(c => c());
	}

	private static nextUseListeners: Delegate<[keyof ClientEvents]>[] = [];
	static OnNextUse(callback: Delegate<[keyof ClientEvents]>)
	{
		ClientHelper.nextUseListeners.push(callback);
	}

	private static crashListeners: (() => void)[] = [];
	static OnCrash(callback: (() => void))
	{
		ClientHelper.crashListeners.push(callback);
	}

	static async PushCommands()
	{
		try
		{
			const { REST } = require('@discordjs/rest');
			const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
	
			await rest.put(
				Routes.applicationGuildCommands(
					process.env.CLIENT_ID,
					process.env.GUILD_ID
				),
				{ body: ClientHelper.slashCommands },
			);
		}
		catch (error)
		{
			Debug.LogError(error);
		}
	}
}

export interface AuthRoles
{
	Community: [];
	Creator: ["973632605754912799"];
	Moderator: ["986754390213947392"];
	Admin: ["848806375668842511"];
}

// Create the client for discord
ClientHelper.client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.GUILD_INVITES,
	Intents.FLAGS.GUILD_VOICE_STATES,
	Intents.FLAGS.GUILD_PRESENCES,
]});