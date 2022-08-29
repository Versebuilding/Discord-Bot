import { ButtonInteraction, MessageOptions } from "discord.js";
import { AskTextQuestion, Buttons, ClientHelper, Fetch } from "../../util-lib";
import { CommandMenus } from "./MenuDeclarations";

async function Refresh(i: ButtonInteraction)
{
	await Promise.all([
		CommandMenus.StandUp.Swap(i),
		i.deferUpdate(),
	]);
}

const standupBtn = ClientHelper.reg_btn("StandupAddingButton", Refresh, undefined, true);
const done = "DONE";
const work = "WORK";
const blok = "BLOK";

const send = ClientHelper.reg_btn("StandupSubmit", async (i) =>
{

})

CommandMenus.StandUp.menu = async (interaction) =>
{
	var base: MessageOptions;
	if (interaction.isButton())
	{
		const msg = await Fetch.ButtonMessage(interaction);
		base = {
			embeds: msg.embeds,
			components: msg.components,
		}

		const ans = await AskTextQuestion({
			content: {
				embeds: [{
					description: "What is something the you got done (`.` to cancel)?"
				}]
			},
			channel: interaction.user,
			validate: (msg) => msg.content.length < 3 ? "Answer must be more than 3 characters" :
								msg.content.length > 300 ? "Answer must be less than 300 characters" : null,
		});
		if (ans)
		{
			if (interaction.customId.endsWith(done))
			{
				base.embeds?.[0].fields?.push({

				});
			}
			else if (interaction.customId.endsWith(work))
			{

			}
			else if (interaction.customId.endsWith(blok))
			{

			}
		}
	}
	else base = {
		embeds: [{
			title: "Create a Standup Update",
			description: "*Hit the buttons below to add tasks to this card*, Standup will be sent to <#" + interaction.channel + ">",
			footer: { text: "" }
		}],
		components: Buttons.ButtonsToLimitedRows([
			Buttons.Empty(standupBtn + done)
				.setStyle("SECONDARY")
				.setEmoji("✅"),
			Buttons.Empty(standupBtn + work)
				.setStyle("SECONDARY")
				.setEmoji("🧗"),
			Buttons.Empty(standupBtn + blok)
				.setStyle("SECONDARY")
				.setEmoji("🚧"),
			Buttons.Empty(standupBtn + send)
				.setStyle("SUCCESS")
				.setEmoji("📤"),
		], 2)
	}


	return base;
}