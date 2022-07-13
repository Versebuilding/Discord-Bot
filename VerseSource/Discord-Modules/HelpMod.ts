import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Authors, Buttons, ClientHelper } from "../util-lib";
import { DiscordModule } from "./DiscordModule";
import { HelpMenus } from "./Menus";

export class HelpMod extends DiscordModule
{
	Initialize(): void
	{
		// ClientHelper.on("guildMemberAdd", async (member: GuildMember) =>
		// {
		// 	if (member.user.bot) return;
		// 	member.send("Welcome to the server! Please read the rules and follow them.");
		// });

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName("help")
				.setDescription("Opens the main hub of information for The Verse and our Discord"),
			OnCMD_Help,
		)
	}
}

async function OnCMD_Help(i: CommandInteraction)
{
	i.reply({
		embeds: [{
			author: Authors.Help,
			title: "Help Menu",
			description: "Looking for some help? No worries, we got you covered! Hit the button on this message and we will send you a DM with a ton of information to get you going.",
			footer: { text: "/help -- Opens the main hub of information for The Verse and our Discord" }
		}],
		components: Buttons.ToRows(
			HelpMenus.InfoMenu.GetDMOpenButton()
				.setStyle("PRIMARY")
		),
		ephemeral: true,
	});
}