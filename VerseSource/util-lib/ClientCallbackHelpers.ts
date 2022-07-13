import { Routes } from "discord-api-types/v9";
import { CommandInteraction, ButtonInteraction, ClientEvents, Awaitable, Client, Interaction, Intents, ModalSubmitInteraction, GuildScheduledEventCreateOptions } from "discord.js";
import { CustomLock } from "./AsyncLock";
import { Fetch } from "./FetchWrapper";
import { Filters } from "./Filters";
import { BaseInteraction, Delegate, SlashCommand } from "./types"
import { Debug } from "./util";

export interface CallbackOptions<K extends keyof ClientEvents>
{
	filter: Delegate<ClientEvents[K], boolean>,
	execute: Delegate<ClientEvents[K]>,
}

interface ClientEventListeners<K extends keyof ClientEvents>
{
	key: K,
	values: CallbackOptions<K>[];
}

export class ClientHelper
{
	static Login(token: string)
	{
		ClientHelper.client.login(token);
		ClientHelper.loggedIn = true;

		// Save space as this is only needed for validation.
		ClientHelper.commandNames = null;
		ClientHelper.buttonIds = null;
		ClientHelper.modalIds = null;
	}

	static loggedIn: boolean = false;
	static client: Client = null;
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
			ClientHelper.BindEvent(event)
				.values.push(options);
	}

	private static commandNames = new Set<string>();
	private static buttonIds = new Set<string>();
	private static modalIds = new Set<string>();

	static reg_cmd(
		cmd: SlashCommand | null,
		execute: Delegate<[CommandInteraction]>,
		filter?: Delegate<[CommandInteraction], boolean>
	) {
		Debug.Assert(!ClientHelper.loggedIn);

		if (cmd != null) {
			ClientHelper.slashCommands.push(cmd);
			Debug.Assert(!ClientHelper.commandNames.has(cmd.name),
				"ClientHelper.reg_cmd() already has registered command with name '" + cmd.name + "'");
			ClientHelper.commandNames.add(cmd.name);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as ((i: Interaction) => Awaitable<void>),
			Filters.Merge(Filters.Command(cmd), filter),
		);
	}

	static reg_btn(
		key: string | null,
		execute: Delegate<[ButtonInteraction]>,
		filter?: Delegate<[ButtonInteraction], boolean>
	) {
		Debug.Assert(!ClientHelper.loggedIn);

		if (key) {
			Debug.Assert(!ClientHelper.buttonIds.has(key),
				"ClientHelper.reg_btn() already has registered button with id '" + key + "'");
			ClientHelper.buttonIds.add(key);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as Delegate<[Interaction]>,
			Filters.Merge(Filters.Button(key), filter)
		);

		return key;
	}

	static reg_mdl(
		key: string | null,
		execute: Delegate<[ModalSubmitInteraction]>,
		filter?: Delegate<[ModalSubmitInteraction], boolean>
	) {
		Debug.Assert(!ClientHelper.loggedIn);

		if (key) {
			Debug.Assert(!ClientHelper.modalIds.has(key),
				"ClientHelper.reg_mdl() already has registered button with id '" + key + "'");
			ClientHelper.modalIds.add(key);
		}

		ClientHelper.on(
			"interactionCreate",
			execute as Delegate<[Interaction]>,
			Filters.Merge(Filters.Modal(key), filter)
		);

		return key;
	}

	static BindEvent<K extends keyof ClientEvents>(x: K): ClientEventListeners<K>
	{
		let listeners: ClientEventListeners<K> = { key: x, values: [] };
		ClientHelper.listeners.push(listeners);

		if (x == "interactionCreate") 
			ClientHelper.client.on(x, async (...args) =>
			{
				let i = args[0] as Interaction;

				if ((i.isButton() || i.isModalSubmit()))
				{
					const btnKey = i.message.id ?? i.customId;
					if (CustomLock.TryAquireKey(btnKey))
					{
						try {
							const matches = listeners.values.filter(l => !l.filter || l.filter(...args));
	
							for await (const l of matches)
								await l.execute(...args);

						} catch (err) {
							Debug.Error(err);
							if (!i.replied && !i.deferred)
								await i.reply({ content: "There was an internal error!", ephemeral: true })
									.catch(() => (i as BaseInteraction).followUp({ content: "There was an internal error!", ephemeral: true })).catch(Debug.Error);
						}
	
						// if (!i.replied && !i.deferred)
						// {
						// 	Debug.Warning("Button with id '" + i.customId + "' did not have a response.");
						// 	await i.reply({
						// 		content: "Button does not have a response! This is most likely due to an bot update or a bug! If you think this is a bug, please reach out to the moderators on discord.",
						// 		ephemeral: true
						// 	});
						// }

						CustomLock.ReleaseKey(btnKey);
					}
					else i.reply({
						content: "Button is already trying to respond (try again)!",
						ephemeral: true
					});
				}
				else
					listeners.values.filter(l => !l.filter || l.filter(...args))
						.forEach(l => l.execute(...args));
			});
		else
			ClientHelper.client.on(x, (...args) =>
			{
				listeners.values.filter(l => !l.filter || l.filter(...args))
					.forEach(l => l.execute(...args));
			});

		return listeners;
	}

	static async PushCommands()
	{
		try
		{
			const { REST } = require('@discordjs/rest');
			const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
			console.log('Started refreshing application (/) commands.');
	
			await rest.put(
				Routes.applicationGuildCommands(
					process.env.CLIENT_ID,
					process.env.GUILD_ID
				),
				{ body: ClientHelper.slashCommands },
			);
			console.log('Successfully reloaded application (/) commands.');
		}
		catch (error)
		{
			console.error(error);
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
]});

Fetch.Guild().then(g => {
	g.scheduledEvents.create({

	})
})

const d: GuildScheduledEventCreateOptions;