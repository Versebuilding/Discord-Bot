import { APIEmbed } from "discord-api-types/v9";
import { ButtonInteraction, EmbedField, EmojiIdentifierResolvable, MessageEmbed, MessageEmbedOptions, MessageOptions  } from "discord.js";
import { BaseInteraction, Buttons, ClientHelper, CloseMessage, Fetch, MessageData, SendConfirmation, Authors, FuncAble, ResolveFuncAble, PartialButtonOptions } from "../../util-lib";
import * as assert from "assert";
import { Debug } from "../../Logging";
import { oauth2 } from "googleapis/build/src/apis/oauth2";

type RegisterOptions = "NONE" | "OPEN" | "DMOPEN" | "OPEN+DMOPEN";

export class MessageMenu
{
	readonly name: string;
	readonly desc: string;
	readonly emoji: EmojiIdentifierResolvable;
	allowed: FuncAble<boolean, [BaseInteraction]>;
	regFlags: RegisterOptions;

	menu?: FuncAble<MessageData, [BaseInteraction]>;
	exitMessage?: FuncAble<string | null, [BaseInteraction]>;

	constructor({ name, desc, emoji, regFlags = "NONE" }: {
		name: string;
		desc: string;
		emoji: EmojiIdentifierResolvable;
		regFlags?: RegisterOptions
	}) {
		assert(name.length < 40);
		this.name = name;
		this.desc = desc;
		this.emoji = emoji;
		this.allowed = true;
		this.regFlags = regFlags;

		if (this.regFlags == "OPEN" || this.regFlags == "OPEN+DMOPEN")
			ClientHelper.reg_btn(this.name + "|default-open", this.JustOpen());

		if (this.regFlags == "DMOPEN" || this.regFlags == "OPEN+DMOPEN")
			ClientHelper.reg_btn(this.name + "|default-dm-open", this.JustDMOpen());
	}

	Title() { return this.name + " " + this.emoji }
	Field(): EmbedField { return {
		name: this.emoji + " " + this.name,
		value:  (this.desc != "") ? this.desc : "N/A",
		inline: false
	}}

	async ConfExit(i: BaseInteraction): Promise<boolean>
	{
		const [channel, exitMessage] = await Promise.all([
			Fetch.InteractionChannel(i),
			ResolveFuncAble(this.exitMessage, i)
		]);

		// No exit message is no need to conf.
		if (exitMessage == null) return true;

		return await SendConfirmation(channel, { embeds: [{
			author: Authors.Warning,
			description: exitMessage,
		}]});
	}

	async Open(i: BaseInteraction)
	{
		assert(this);
		if (!this.menu)
			throw new Error("'" + this.name + "'.menu has not been set yet!");

		const [channel, menu] = await Promise.all([
			Fetch.InteractionChannel(i),
			ResolveFuncAble(this.menu, i)
		]);

		if (menu) await channel.send(menu);
	}

	/** Binds this to MessageMenu.Open() and adds an interaction reply. */
	JustOpen(): (i: BaseInteraction) => Promise<void>
	{
		assert(this.regFlags == "OPEN" || this.regFlags == "OPEN+DMOPEN");
		var _this = this;
		return async (i) => {
			await _this.Open(i);
			if (i.isCommand())
				await i.reply({ content: "Menu opened!", ephemeral: true });
			else await i.deferUpdate();
		};
	}

	async DMOpen(i: BaseInteraction)
	{
		assert(this);
		await i.user.send(await ResolveFuncAble(this.menu, i));
	}

	/** Binds this to MessageMenu.DMOpen() and adds an interaction reply. */
	JustDMOpen(): (i: BaseInteraction) => Promise<void>
	{
		assert(this.regFlags == "DMOPEN" || this.regFlags == "OPEN+DMOPEN");
		var _this = this;
		return async (i) => {

			const def_promise = i.isButton() ?
				i.deferUpdate() :
				i.deferReply({ ephemeral: true });
			
			await Promise.all([
				_this.DMOpen(i),
				def_promise
			]);

			if (i.isCommand())
				await i.followUp("Menu opened!");
		};
	}

	async Swap(btn: ButtonInteraction)
	{
		var channelPromise = Fetch.InteractionChannel(btn);
		if (this.menu)
		{
			const [channel, menu] = await Promise.all([
				channelPromise,
				ResolveFuncAble(this.menu, btn)
			]);
			
			await channel.send(menu)

			await CloseMessage(btn).catch(e => Debug.LogError("Could not close message for swap. ", e));
		}
		else
		{
			Debug.LogError(new Error("Menu was not set!"));
			const errorMessage = "There was an internal error opening a message to respond to this button!";

			await btn.reply({ content: errorMessage, ephemeral: true }).catch(async () => 
				(await channelPromise).send(errorMessage).catch(Debug.LogError));
		}
	}

	private GetConstButtonWithId(id: string)
	{
		return Buttons.Data(id, {
			emoji: this.emoji,
			label: this.name
		});
	}

	async AsyncGetButtonWithId(id: string, i: BaseInteraction)
	{
		return this.GetConstButtonWithId(id)
			.setDisabled(!await ResolveFuncAble(this.allowed, i));
	}

	// private RegOpenId()
	// {
	// 	Debug.Assert(!(this.regFlags == "OPEN"), "MessageMenu.Open on '" + this.name + "' is being registered twice.");
	// 	ClientHelper.reg_btn(this.name + "|default-open", this.Open);
	// 	this.regFlags |= MenuRegFlags.Open;
	// }
	GetOpenId = () => (this.regFlags == "OPEN" || this.regFlags == "OPEN+DMOPEN") ?
		this.name + "|default-open" :
		Buttons.NotReg(`MessageMenu.Open on '${this.name}'`);

	// private RegDMOpenId()
	// {
	// 	Debug.Assert(!(this.regFlags & MenuRegFlags.DMOpen), "MessageMenu.DMOpen on '" + this.name + "' is being registered twice.");
	// 	ClientHelper.reg_btn(this.name + "|default-dm-open", this.DMOpen);
	// 	this.regFlags |= MenuRegFlags.DMOpen;
	// }
	GetDMOpenId = () => (this.regFlags == "DMOPEN" || this.regFlags == "OPEN+DMOPEN") ?
		this.name + "|default-dm-open" :
		Buttons.NotReg(`MessageMenu.DMOpen on '${this.name}'`);

	//RegOpenButton = () => this.GetConstButtonWithId(this.RegOpenId());
	GetOpenButton = () => this.GetConstButtonWithId(this.GetOpenId());

	//RegDMOpenButton = () => this.GetConstButtonWithId(this.RegDMOpenId()); 
	GetDMOpenButton = () => this.GetConstButtonWithId(this.GetDMOpenId());

	RegSwap(otherMenu: MessageMenu, refreshOnFail: boolean = true): string
	{
		var thisMenu = this;
		return ClientHelper.reg_btn("SWAP:" + this.name + "->" + otherMenu.name, async function(i)
		{
			Debug.Log("Swapping...");
			i.deferUpdate();
			
			const conf = await thisMenu.ConfExit(i)
			if (!conf)
			{
				if (refreshOnFail)
					// Close this menu, and reopen.
					await thisMenu.Swap(i);
			}
			else await otherMenu.Swap(i)
		});
	}

	/**
	 * Builds the fields and components for a message that contains buttons to other menus.
	 * Can only be used durning import/init (buttons need to have ids registered).
	 * @param base The embed that forms the surrounding text for menu options.
	 * @param sub_menus The menus (in order) that should be included on the main menu.
	 */
	MakeDirectoryMenu(
		base: MessageOptions,
		sub_menus: MessageMenu[],
		styles: FuncAble<PartialButtonOptions, [BaseInteraction]>[] = []): void
	{
		assert(!ClientHelper.loggedIn);

		var labelPre = "DirMenu_" + this.name + "|"; 
		const ids = sub_menus.map(menu =>
			this.RegSwap(menu));

		var lastEmbed: MessageEmbed | MessageEmbedOptions | APIEmbed
			= base.embeds ? base.embeds[base.embeds.length - 1] : {};

		lastEmbed.fields = [];
		sub_menus.forEach(menu =>
			lastEmbed.fields.push(menu.Field())
		);

		const buttonRowLimit = Buttons.GetBestRowLength(sub_menus.length);

		this.menu = async (interaction) =>
		{
			base.components = Buttons.ButtonsToLimitedRows(
				await Promise.all(sub_menus.map(async (menu, index) =>
				{
					const options: PartialButtonOptions = styles[index] !== null && styles[index] !== void 0 ?
						(await ResolveFuncAble(styles[index], interaction)) ?? {} : {};

					options.style = options.style ?? "PRIMARY";
					options.disabled = options.disabled ?? !await ResolveFuncAble(menu.allowed, interaction);
					options.label = options.label ?? menu.name;
					options.emoji = options.emoji ?? menu.emoji;

					return Buttons.Data(ids[index], options);
				})), buttonRowLimit
			);
			return base;
		}
	}
}