import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { CommandInteraction, CacheType, ButtonInteraction, Message, GuildMemberRoleManager } from "discord.js";
import { resolveModuleName } from "typescript";
import { DiscordModule } from "../Discord-Modules";
import { CustomLock } from "./AsyncLock";
import { FetchButtonMessage } from "./FetchWrapper";
import { Debug, GetComponentFromMessage, GlobalVariables } from "./util";

export class ClientCallbackData
{
	cc_ready: ClientCallbackReady[] = [];
	addClientReady(ready: ClientCallbackReady) { this.cc_ready.push(ready); };

	mc_create: MessageCallbackCreate[] = [];
	addMsgCreate(msg: MessageCallbackCreate) { this.mc_create.push(msg); };

	ic_buttons: InteractionCallbackButton[] = [];
	addButton(button: InteractionCallbackButton) { this.ic_buttons.push(button); };
	addMap(button: ButtonCallbackMap) { this.ic_buttons.push({
		filter: i => i.customId.startsWith(button.prefix + button.seporator),
		execute: button.MapButton.bind(button)
	}); };

	ic_commands: InteractionCallbackCommand[] = [];
	addCommand(cmd: InteractionCallbackCommand) { this.ic_commands.push(cmd); };
}

export interface ClientCallbackReady
{
	execute: () => Promise<void>;
}

export interface MessageCallbackCreate
{
	filter?: (msg: Message<boolean>) => boolean;
	execute: (msg: Message<boolean>) => Promise<void>;
}

export class ButtonCallbackMap
{
	constructor(prefix: string, seporator: string = "|")
	{
		this.prefix = prefix;
		this.seporator = seporator;
	}
	
	readonly prefix: string;
	readonly seporator: string;

	private nMap: Map<string, (interaction: ButtonInteraction<CacheType>) => Promise<boolean | void>>;
	private ID: number = 0;

	private MakeBtnId_Labels(...labels: string[]): string
	{
		const result =  [this.prefix, ...labels].join(this.seporator);
		if (result.length > 99) throw new Error("Button CustomID cannot exceed 99 characters.");
		return
	}

	MakeBtnId(...funcs: ((interaction: ButtonInteraction<CacheType>) => Promise<boolean | void>)[])
		: string
	{
		const map = this;
		return this.MakeBtnId_Labels(...funcs.map(f =>
		{
			let pair = [...map.nMap.entries()].find(([_, x]) => x === f);
			let key :string;
			if (!pair)
			{
				key = f.name;
				if (key == "" || map.nMap.has(key))
					key += (this.ID++).toString();
	
				map.nMap.set(key, f);
			}
			else key = pair[0];

			return key;
		}));
	}

	async MapButton(button: ButtonInteraction<CacheType>)
	{
		Debug.Log("Reading button from ButtonMap...");
		// The first in the squence is "Onboarding_"
		const buttonSquence = button.customId.split(this.seporator);

		try { for (let squIndex = 1; squIndex < buttonSquence.length; squIndex++)
		{
			let sId = buttonSquence[squIndex];
			let val = this.nMap.get(sId);
			if (val)
			{
				if (await val(button)) break;
			}
			else
				Debug.Log("Could not map squence id: '" + sId + "'. Skipping...");
		} } catch(e) { Debug.LogError("Caught an error while running button map.", e); }
	}
}

export interface InteractionCallbackButton
{
	customId?: string;
	filter?: (interaction: ButtonInteraction<CacheType>) => boolean;
	execute: (interaction: ButtonInteraction<CacheType>) => Promise<void>;
}

export interface InteractionCallbackCommand
{
	cmd: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
	adminOnly?: boolean;
	execute: (interaction: CommandInteraction<CacheType>) => Promise<void>;
}

/**
 * Initializes and Syncs the commands with given modules with discord.
 * 
 * @param mods Modules that should be included with this bot
 */
export function SetupCommands(mods: DiscordModule[]): void
{
	const callbackDatas: ClientCallbackData[] = mods.map(m => m.Initialize());
	const readyCallbacks = callbackDatas.flatMap(cd => cd.cc_ready);
	const msgCallbacks = callbackDatas.flatMap(cd => cd.mc_create);
	const buttonCallbacks = callbackDatas.flatMap(cd => cd.ic_buttons);
	const commandCallbacks = callbackDatas.flatMap(cd => cd.ic_commands);

	let commands = commandCallbacks.map(c => c.cmd);

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

	GlobalVariables.client
		.on("ready", () => readyCallbacks.forEach(r => r.execute()))
		.on("messageCreate", msg => {
			msgCallbacks.filter(m => (!m.filter || m.filter(msg)))
				.forEach(m => m.execute(msg));
		})
		.on("guildMemberAdd", async m => )
		.on("interactionCreate", async i =>
		{
			if (i.isCommand())
				commandCallbacks.find(c =>
					(c.cmd.name == i.commandName) &&
					(
						!c.adminOnly //||
						//(i.member.permissions.has())
					)
				).execute(i);
			else if (i.isButton())
			{
				let key = i.message.id + i.customId;
				let aquired = false;

				await Promise.race([
					new Promise(async (_, reject) => {
						await new Promise(r => setTimeout(r, 2800));
						reject(new Error("Button interaction did not resolve, and has timed out!"));
					}),
					new Promise(async (resolve, reject) =>
					{
						await CustomLock.AsyncAquireKey(key);
						aquired = true;

						//if (await ValidateButtonInteraction(i))
						//{
							let cb = buttonCallbacks.find(b => (!b.filter || b.filter(i)) && (!b.customId || b.customId == i.customId));
							if (cb) await cb.execute(i);

							// console.log(i);
							// if (i.isRepliable())
							// 	reject(new Error("Did not respond to button!"));

							resolve(null);
						//}
				}) ]).catch(e => {
					// if (i.isRepliable())
					// {
					// 	i.reply({
					// 		content: "Discord Bot is online but an error has occured with this interaction!",
					// 		ephemeral: true,
					// 	});
					// }

					Debug.LogError("There was an error while waiting for interaction to respond:", e);

					// Debug.Print({ embeds: [{
					// 	color: "RED",
					// 	title: "Interaction Error!",
					// 	description: "There was an error while waiting for interaction to respond: " + e.message,
					// 	footer: { text: "Interaction from '" + i.user.username + "' on button with id '" + i.customId + "'" }
					// }] });
				});

				if (aquired)
				{
					CustomLock.ReleaseKey(key)
					console.log("Released Lock.");
				}
				else console.log("Could not get lock!");
			}
		});
}

async function ValidateButtonInteraction(button: ButtonInteraction<CacheType>): Promise<boolean>
{
	try
	{
		// Make sure that button still exists. Error if else.
		let msg = await FetchButtonMessage(button);

		// Make sure that button is still enabled
		if (GetComponentFromMessage(msg, button.id).disabled)
			return false;

		return true;
	}
	catch { return false }
}
