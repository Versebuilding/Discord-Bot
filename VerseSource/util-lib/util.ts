import { APIEmbed, APIMessage } from 'discord-api-types/v9';
import { Message, Client, CacheType, ButtonInteraction, MessageActionRow, MessageButton, EmojiResolvable, Util, CollectorFilter, MessageReaction, User, Collection, MessageOptions, InteractionCollector, MessageComponentInteraction, MessageComponentCollectorOptions, CollectorResetTimerOptions, PartialTextBasedChannelFields, MessageEmbed, MessageEmbedOptions, MessageActionRowComponent, MessagePayload, MessageEditOptions, Awaitable, ColorResolvable, Interaction, InteractionReplyOptions } from "discord.js";
import { InterfaceType, readBuilderProgram } from 'typescript';
import { Debug } from '../Logging';
import { CustomLock } from './AsyncLock';
import { ClientHelper } from './ClientHelper';
import { Fetch } from "./FetchWrapper";
import { BaseInteraction, FuncAble } from './types';
const path = require('node:path');


export function GetLinksFromString(str: string): RegExpMatchArray
{
	return str.match(COMMON_REGEXPS.URL);
}

function MessageOptionsStringShorthand(msg: MessageOptions): string
{
	let result = "";
	if (msg.content)
		result += msg.content.trim() + " >> ";

	if (msg.embeds) msg.embeds.forEach((e, i) =>
	{
		if (msg.embeds.length > 1) result += `Embed #${i} >> `;

		if (e.author && e.author.name) result += e.author.name + " >> "
		if (e.title) result += e.title + " >> ";
		if (e.description) result += e.description + " >> ";
	});

	if (msg.components) msg.components.forEach((cs) => {
		cs.components.forEach(c => {
			if (c.type == "BUTTON")
				result += `comp: ${(c as MessageButton).label}` + " >> ";
			// else
			// 	result += `comp: ${c.customId}` + " >> ";
		})
	});

	result.substring(0, result.length - 4);

	return result;
}

export function PreviewMessage(msg: Message<boolean>, len: number = 50): string
{
	return msg.content.substring(0, msg.content.length > len ? len : msg.content.length);
}

export function EmbeddedPreviewMessage(msg: Message<boolean>): MessageEmbedOptions[]
{
	var options: MessageEmbedOptions[] = [{
		color: "PURPLE",
		title: "Preview of Message:",
		description: "Sent by: " + msg.author.username + " on <t:" + msg.createdTimestamp + ">",
		thumbnail: { url: msg.author.avatarURL() }
	}];

	if (msg.author.bot)
		if (msg.embeds && msg.embeds.length > 0)
			msg.embeds.forEach(e => options.push(e));

	if (msg.content)
	{
		let short; 
		if (msg.content.length > 300) short = msg.content.substring(0, 298) + "...";
		else short = msg.content;

		options[0].description += "\n>>> " + msg.content;
	}

	return options;
}

export function GetNumberEmoji(number: number)
{
	return (number < 10 && number >= 0) ? ([
		"1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"
	])[number] : "0️⃣";
}

export async function EmojiEquals(a: EmojiResolvable, b: EmojiResolvable)
{
	const raw_a = Util.resolvePartialEmoji(a);
	const raw_b = Util.resolvePartialEmoji(b);
	var result = true;

	if (raw_a.name && raw_b.name)
		result = result && raw_a.name == raw_b.name;

	if (raw_a.id && raw_b.id)
		result = result && raw_a.id == raw_b.id;

	if (raw_a.animated && raw_b.animated)
		result = result && raw_a.animated == raw_b.animated;

	return result;
}

export async function MessageReactionCallback(msg: Message<boolean>, emoji: EmojiResolvable,
	callback: (collected: Collection<string, MessageReaction>) => void, timeout: number = 60000)
{
	await msg.react(emoji);

	const rfilter: CollectorFilter<[MessageReaction, User]> = async (reaction, user) => {
		return (await EmojiEquals(reaction.emoji, emoji)) && (user.id != ClientHelper.client.user.id);
	};

	msg.awaitReactions(
		{ filter: rfilter, max: 1, time: timeout, errors: ['time'] }
	).then(collected => {
		Debug.Log(`-> Reaction Received on message ${msg.id}`);
		callback(collected);
	}).catch(async collected =>
	{
		try {
			Debug.Log(`-> Reaction timed-out on message ${msg.id}`);
			const userReactions = msg.reactions.cache.filter(
				reaction => reaction.users.cache.has(ClientHelper.client.user.id));

			for await (const reaction of userReactions.values()) {
				reaction.users.remove(ClientHelper.client.user.id);
			}
		} catch (error) {
			console.error('Failed to remove reactions.');
		}
	});
}

export async function RemoveReactionFromMsg(msg: Message<boolean>, emoji: EmojiResolvable)
{
	return msg.reactions.cache.forEach(async reaction => {
		if(await EmojiEquals(reaction.emoji, emoji))
			try { await reaction.remove(); } catch {}
	});
}

export async function ConfirmButtonInteraction(button: ButtonInteraction<CacheType>, message: string)
	: Promise<boolean>
{
	return new Promise(async resolve => {
		const r = await button.reply({
			content: message,
			components: [{
				type: 1,
				components: [{
					style: 3,
					label: "Yes",
					custom_id: "yes",
					disabled: false,
					emoji: { name: "☑️" },
					type: 2
				}, {
					style: 4,
					label: "No",
					custom_id: "no",
					disabled: false,
					emoji: { name: "⛔" },
					type: 2
				}]
			}],
			ephemeral: true,
			fetchReply: true
		},);


		const rpl = await button.fetchReply() as Message;
	
		const collect = CreateMCCWithFooterTimer(rpl, {time: 120000});
	
		collect.on("collect", async b => {
			if (b.customId.endsWith("yes"))
			{
				try { await button.editReply({ content: "Confirmed", components: [] }) } catch {};
				resolve(true);
			}
			else if (b.customId.endsWith("no"))
			{
				try { await button.editReply({ content: "Action Canceled", components: [] }) } catch {};
				resolve(false);
			}
		});
	});
}

export function AwaitButtonFollowup(interaction: BaseInteraction, options: InteractionReplyOptions): Promise<ButtonInteraction>
{
	if (!options.components) throw new Error("No components provided.");

	options.ephemeral = true;
	options.fetchReply = true;
	

	return new Promise(async resolve =>
	{
		var rpl: Message<boolean>;
		try
		{
			if (!interaction.replied && !interaction.deferred)
			{
				await interaction.reply(options);
				rpl = await interaction.fetchReply() as Message;
			}
		}
		catch (error)
		{
			
		}

		if (!rpl) rpl = await interaction.followUp(options) as Message<boolean>;
	
		const collect = rpl.createMessageComponentCollector({ time: 3000000 });
		collect.on("collect", resolve);
	});
}

export async function SendConfirmation(channel: PartialTextBasedChannelFields, message: {
		content?: string | null,
		embeds?: (MessageEmbed | MessageEmbedOptions | APIEmbed)[]})
	: Promise<boolean>
{
	return new Promise(async (resolve) =>
	{
		const rpl = await channel.send({
			content: message.content,
			embeds: message.embeds,
			components: [{
				type: 1,
				components: [{
					style: 3,
					label: "Yes",
					custom_id: "yes",
					disabled: false,
					emoji: { name: "☑️" },
					type: 2
				}, {
					style: 4,
					label: "No",
					custom_id: "no",
					disabled: false,
					emoji: { name: "⛔" },
					type: 2
				}]
			}]
		});
	
		const collect = CreateMCCWithFooterTimer(rpl, {time: 120000});
	
		collect.on("collect", async b =>
		{
			rpl.delete().catch(e => Debug.Log("Could not delete reply for confirmation message.:", e));
			if (b.customId.endsWith("yes"))
			{
				try { await b.reply({ content: "Confirmed", ephemeral: true }) } catch {};
				resolve(true);
			}
			else if (b.customId.endsWith("no"))
			{
				try { await b.reply({ content: "Action Canceled", ephemeral: true }) } catch {};
				resolve(false);
			}
		});
	});
}

export async function SendAcceptNote(channel: PartialTextBasedChannelFields, message: {
	content?: string | null,
	embeds?: (MessageEmbed | MessageEmbedOptions | APIEmbed)[]}, label = "Understood")
: Promise<void>
{
let c : MessageOptions;
return new Promise(async (resolve) =>
{
	const rpl = await channel.send({
		content: message.content,
		embeds: message.embeds,
		components: [{
			type: 1,
			components: [{
				style: 3,
				label: label,
				custom_id: "send-accept",
				disabled: false,
				emoji: { name: "☑️" },
				type: 2
			}]
		}]
	});

	const collect = CreateMCCWithFooterTimer(rpl, {time: 120000});

	collect.on("collect", async b =>
	{
		await rpl.delete().catch(e => Debug.LogError("Could not delete reply for confirmation message.:", e));
		resolve();
	});
});
}

export function msToTime(milli_secs: number, includeMs: boolean = false)
{
	var ms = milli_secs % 1000;
	milli_secs = (milli_secs - ms) / 1000;
	var secs = milli_secs % 60;
	milli_secs = (milli_secs - secs) / 60;
	var mins = milli_secs % 60;
	var hrs = (milli_secs - mins) / 60;

	let result = "";
	if (hrs > 0)
		result += hrs + "hr ";
	if (mins > 0)
		result += mins + "min "
	if (secs > 0 || !includeMs)
		result += secs + "sec ";
	if (includeMs)
		result += ms + "ms ";
	return result.substring(0, result.length - 1);
}

export function AwaitForSeconds<T>(promise: Promise<T>): Promise<T>
{
	return Promise.race([
		new Promise<T>(async (_, reject) => {
			await new Promise(r => setTimeout(r, 2800));
			reject(new Error("Button interaction did not resolve, and has timed out!"));
		}),
		promise
	]);
}

export async function CloseMessage(button: ButtonInteraction<CacheType>, respond = false): Promise<boolean | unknown>
{
	try {
		let msg = await Fetch.ButtonMessage(button);
		await CustomLock.WaitToHoldKey(msg.id, async () => await msg.delete());
		if (respond)
			await button.deferUpdate();
		return true;
	} catch {
		Debug.Log("Message already deleted. Probably two buttons clicked at once. Breaking.");
	}
}

async function _UpdateFooterTimer(message: Message<boolean>, endTime: number, intervaler?: NodeJS.Timer)
{
	const key = message?.id;

	try {
		if (!(key && CustomLock.TryAcquireKey(key) && await message.fetch(true)))
		{
			if (intervaler) clearInterval(intervaler);
			return;
		}
		
		if (message.embeds.length <= 0)
			message.embeds.push();

		message.embeds[message.embeds.length - 1].setFooter({
			text: "Interactions will expire in " + msToTime(endTime - Date.now()),
			iconURL: "https://cdn-icons-png.flaticon.com/512/3003/3003202.png"
		});
		return await message.edit({ embeds: message.embeds});

	}
	catch(e)
	{
		Debug.LogError("Update timer error: ", e);
	}
	finally
	{
		CustomLock.ReleaseKey(key);
	}
}

export function CreateMCCWithFooterTimer(message: Message<boolean>, options?: {
    componentType?: "ACTION_ROW";
} & MessageComponentCollectorOptions<MessageComponentInteraction<CacheType>>)
	: InteractionCollector<MessageComponentInteraction<CacheType>>
{
	var time = 300000;
	if (options && options.time) time = options.time;

	var collector = message.createMessageComponentCollector(options);
	var end = Date.now() + time;

	let intervaler = setInterval(() => _UpdateFooterTimer(message, end, intervaler), 3000);

	let save = collector.resetTimer;
	collector.resetTimer = (options?: CollectorResetTimerOptions) =>
	{
		Debug.Log("Resetting Timer");
		if (!options) options = {};
		if (!options.time) options.time = time;

		end = Date.now() + options.time;
		save.call(collector, options);
	};

	collector.on("end", () => clearInterval(intervaler));

	return collector;
}

export async function AskTextQuestion({
	content, channel,
	validate = async msg => (msg.content.length < 1024) ? null : "Your answer was too long (1024 char max)",
	time = 540000,
	useTimer = false
}: {
	content: MessageOptions;
	channel: PartialTextBasedChannelFields;
	validate?: (msg: Message<boolean>) => Awaitable<string | null>;
	time?: number;
	useTimer?: boolean;
})
	: Promise<Message<boolean>>
{
	const q = await channel.send(content);
	const ansChannel = q.channel;

	var end = Date.now() + time;

	let a: Message<boolean> = null;
	let intervaler: NodeJS.Timer;

	try
	{
		if (useTimer)
			intervaler = setInterval(() => _UpdateFooterTimer(q, end), 3000);

		while(true)
		{
			Debug.Log("Asking...");
			const msgs = (await ansChannel.awaitMessages({
				filter: (msg) => !msg.author.bot,
				max: 1,
				time: end - Date.now()
			}).catch(e => Debug.LogError("There was an error while awaiting messages.", e)));

			// Timeout...
			if (!msgs || msgs.size == 0)
			{
				await q.delete().catch(() => {});
				break;
			}

			// Message found but didn't load?
			if (msgs.first() == null)
				throw new Error("Asking question did not time out, yet the answer message was null.");

			a = msgs.first();
			Debug.Log("...answered: " + a.content);

			let err = await validate(a);
			Debug.Log("Validation complete: " + err);

			if (!err) break;

			else if (await SendConfirmation(channel, {  embeds: [{
				description: err + ". Would you like to try again?",
				color: "RED",
			}] }))
				continue; // If ask again...
			else
			{
				a = null;
				break;
			}
		}
	} catch(e) { Debug.LogError("There was an awaiting message.", e); }
	finally
	{
		if (useTimer && intervaler)
		{
			Debug.Log("Clearing interval");
			clearInterval(intervaler);
			q.embeds[q.embeds.length - 1].setFooter({ text: ""});
			await q.edit({ embeds: q.embeds}).catch(/*Debug.Error*/ () => {});
		}
	}

	return a;
}

export function EditAppendFieldTitle(embed: MessageEmbed, name: string, value: string)
{
	let x = embed.fields.find(i => i.name == name);
	if (x) x.value = value;
	else embed.addField(name, value);
}

export function GetComponentFromButton(btn: ButtonInteraction): Promise<MessageButton>
{
	return Fetch.ButtonMessage(btn).then(msg => GetComponentFromMessage(msg, btn.customId) as MessageButton);
}

export function GetComponentFromMessage(msg: Message<boolean>, customId: string): MessageActionRowComponent
{
	msg.components.forEach(row =>
		row.components.forEach(c => {
			if (c.customId == customId)
				return c;
		})
	);

	// Not found
	return null;
}

async function ValidateButtonInteraction(button: ButtonInteraction<CacheType>): Promise<boolean>
{
	try
	{
		// Make sure that button still exists. Error if else.
		let msg = await Fetch.ButtonMessage(button);

		// Make sure that button is still enabled
		if (GetComponentFromMessage(msg, button.id).disabled)
			return false;

		return true;
	}
	catch { return false }
}

export const COMMON_REGEXPS = {
	ONLY_EMAIL: /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/g,
	ONLY_PHONE: /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/g,
	URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*[^\.\|\'\#\!\|\(\?\,\>\<\;\)\]\[\{\}])/gim,
};

export function ToColor(str: string): ColorResolvable | null
{
	// Try rgb(,,)
	let start = str.indexOf("(") + 1, end = str.indexOf(")");
	if (end == -1 && start == 0) end == str.length;

	if (end != -1)
	{
		const rgb: number[] = str.slice(
			start, 
			end
		).split(",").map(s => parseInt(s.trim()));

		Debug.Log("RGB: ", rgb);
		if (rgb.length == 3 && !rgb.find(c => isNaN(c) || c < 0 || c > 255))
			return [rgb[0], rgb[1], rgb[2]];
		return null;
	}

	// Try Number
	let num: number | null = null;
	// Hex: #FF
	if (str.match(/^#[0-9a-fA-F]{1,6}$/g))
		num = parseInt(str.slice(1), 16);
	// Hex: 0xFF
	else if (str.match(/^0[xX][0-9a-fA-F]{1,6}$/g))
		num = parseInt(str, 16);
	// Int: 3450
	else if (str.match(/^[0-9]{1,8}$/g))
		num = parseInt(str);
	// Hex: FF23A
	else if (str.match(/^[0-9a-fA-F]{1,6}$/g))
		num = parseInt(str, 16);

	if (num != null)
	{
		if (isNaN(num) || num < 0 || num > 16777215)
			return null;
		else return num;
	}

	// Color string
	str = str.toUpperCase();
	let color = [
		'DEFAULT',
		'WHITE',
		'AQUA',
		'GREEN',
		'BLUE',
		'YELLOW',
		'PURPLE',
		'LUMINOUS_VIVID_PINK',
		'FUCHSIA',
		'GOLD',
		'ORANGE',
		'RED',
		'GREY',
		'DARKER_GREY',
		'NAVY',
		'DARK_AQUA',
		'DARK_GREEN',
		'DARK_BLUE',
		'DARK_PURPLE',
		'DARK_VIVID_PINK',
		'DARK_GOLD',
		'DARK_ORANGE',
		'DARK_RED',
		'DARK_GREY',
		'LIGHT_GREY',
		'DARK_NAVY',
		'BLURPLE',
		'GREYPLE',
		'DARK_BUT_NOT_BLACK',
		'NOT_QUITE_BLACK',
		'RANDOM'
	].find(c => c == str);

	if (color) return color as ColorResolvable;
	else return null;
}

export function ResolveFuncAble<T extends object | string | number | boolean, A extends unknown[]>(data: FuncAble<T, A>, ...args: A): Awaitable<T>
{
	if (typeof data == "function")
	{
		return data(...args);
	}
	else return data;
}