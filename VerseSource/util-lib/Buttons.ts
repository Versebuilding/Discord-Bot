import { ButtonInteraction, MessageButton, EmojiIdentifierResolvable, MessageActionRow } from "discord.js";
import { Debug } from "../Logging";
import { ClientHelper } from "./ClientHelper";
import { PartialButtonOptions } from "./types";

export const Buttons =
{
	Back: function(id: string, pg?: string): MessageButton
	{
		return new MessageButton()
			.setStyle("SECONDARY")
			.setLabel("Back" + (pg ? ` (pg ${pg})` : ""))
			.setEmoji("⬅️")
			.setCustomId(id)
	},

	Next: function(id: string, pg?: string): MessageButton
	{
		return new MessageButton()
			.setStyle("SECONDARY")
			.setLabel("Next" + (pg ? ` (pg ${pg})` : ""))
			.setEmoji("➡️")
			.setCustomId(id)
	},

	Data: function(id: string, data: PartialButtonOptions): MessageButton
	{
		return new MessageButton({
			label: data.label ?? "Button",
			style: data.style ?? "SECONDARY",
			emoji: data.emoji ?? undefined,
			disabled: data.disabled ?? false,
			customId: id
		});
	},

	Empty: function(id: string)
	{
		return new MessageButton()
			.setCustomId(id)
	},

	Link: function(data: {
		url: string
		label?: string,
		emoji?: EmojiIdentifierResolvable,
		disabled?: boolean,
	})
	{
		return new MessageButton({
			style: "LINK",
			url: data.url,
			label: data.label ?? "Link",
			emoji: data.emoji ?? undefined,
			disabled: data.disabled ?? false,
		});
	},

	ToRows: (btn: MessageButton) => [new MessageActionRow().addComponents(btn)],
	ButtonsToRows: (...buttons: MessageButton[]) => Buttons.AddButtonsToRows([...buttons], []),
	ButtonsToLimitedRows: (buttons: MessageButton[], rowLimit: number): MessageActionRow[] =>
	{
		(rowLimit > 0 && rowLimit < 5);
		const comps: MessageActionRow[] = [];

		for(var i = 0; i < Math.ceil(buttons.length / rowLimit); i++)
			comps.push(new MessageActionRow());

		buttons.forEach((btn, index) => {
			comps[Math.floor(index / rowLimit)].addComponents(btn);
		});
		return comps;
	},
	AddButtonsToRows: function(buttons: MessageButton[], comps: MessageActionRow[]): MessageActionRow[]
	{
		buttons.forEach(btn => {
			if (comps.length == 0 || comps[comps.length - 1].components.length >= 5)
				comps.push(new MessageActionRow());
			comps[comps.length - 1].addComponents(btn);
		});
		return comps;
	},

	GetBestRowLength: (numberOfButtons: number) =>
		(numberOfButtons <= 3) ? 5 :
		(numberOfButtons == 4) ? 2 :
		(numberOfButtons <= 6) ? 3 :
		(numberOfButtons <= 8) ? 4 :
		(numberOfButtons == 10) ? 5 :
		(numberOfButtons <= 12) ? 4 :
		(numberOfButtons <= 15) ? 5 :
		(numberOfButtons == 16) ? 4 :
		5,

	NullCall: "null call",
	NotImplemented: "not implemented",
	NotReg: (context: any) => {
		Debug.LogWarning("Not Registered warning!!: " + context?.toString());
		return "not registered";
	}
}

ClientHelper.reg_btn(Buttons.NullCall, (i: ButtonInteraction) =>
	Debug.LogError(new Error("Interaction is a Null interaction. This should never be called!")));
ClientHelper.reg_btn(Buttons.NotImplemented, (i: ButtonInteraction) =>
	i.reply("This button has not been implemented yet! If you think this is a problem, please reach out the admin at The Verse."));
ClientHelper.reg_btn("not registered", (i: ButtonInteraction) =>
	i.reply("This button has not been registered. This is likely a bug, please reach out to NevinAF."));