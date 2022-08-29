import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { ClientHelper } from "../util-lib";
import { CommandMenus } from "./Menus/MenuDeclarations";

ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName('create-event')
	.setDescription('Creates an event!'),
	CommandMenus.eventCreator.JustDMOpen()
);
