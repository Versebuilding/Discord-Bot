import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { ClientHelper } from "../util-lib";
import { CommandMenus } from "./Menus/MenuDeclarations";

ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName("create-standup")
	.setDescription("A helper to create a daily standup."),
	OnCMD_CreateStandUp
);

async function OnCMD_CreateStandUp(cmd: CommandInteraction)
{
	await Promise.all([
		CommandMenus.StandUp.DMOpen(cmd),
		cmd.reply({ embeds: [{ description: "Direct message sent for setting up standup." }]})
	]);
	
}
