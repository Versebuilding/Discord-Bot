import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, Channel, ColorResolvable, CommandInteraction, GuildBasedChannel, Message, MessageButton, MessageEmbedOptions, MessageOptions, User } from "discord.js";
import { AskTextQuestion, Authors, Buttons, ClientHelper, CloseMessage, COMMON_REGEXPS, Delegate, Fetch, GetRoleInfo, IconLinks, Roles, SendAcceptNote, SendConfirmation, SheetsHelpers, ToColor, Profiles } from "../util-lib";
import { CommandMenus, HelpMenus, MessageMenu } from "./Menus";

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Display the 'Verse Profile' of a user.")
		.addUserOption(o => o
			.setName("user")
			.setDescription("User that should be displayed. If empty, then shows self.")
			.setRequired(false))
		.addChannelOption(o => o
			.setName("post-to-channel")
			.setDescription("Instead of a private message, you can post this to a channel!")
			.setRequired(false)),
	OnCMD_Profile);

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("edit-profile")
		.setDescription("Edit your own 'Verse Profile'."),
	CommandMenus.profileSetup.JustDMOpen());

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("introduction")
		.setDescription("Display the company introduction of a user.")
		.addUserOption(o => o
			.setName("user")
			.setDescription("User that should be displayed. If empty, then shows self.")
			.setRequired(false)),
	OnCMD_Introduction);

async function OnCMD_Profile(cmd: CommandInteraction)
{
	var target: User = cmd.options.getUser("user");
	var channel = cmd.options.getChannel("post-to-channel");
	if (!target) target = cmd.user;

	if (channel == null)
		cmd.reply({ embeds:[await Profiles.LoadEmbed_Personal(target.id, true)], ephemeral: true });
	else
	{
		await Fetch.Channel(channel.id).then(async c => {
			if (c.isText())
			{
				await c.send({ embeds:[await Profiles.LoadEmbed_Personal(target.id, true)] });
				await cmd.reply({ embeds: [{ author: Authors.Core, description: "Your message has been sent!" }], ephemeral: true });
			}
			else await cmd.reply({ embeds: [{ author: Authors.Error, description: "The channel you sent is not a text channel!" }], ephemeral: true });
		}).catch(() => cmd.reply({ embeds: [{ author: Authors.Error, description: "There was an error trying to send the message." }], ephemeral: true }));
	}
}

async function OnCMD_Introduction(cmd: CommandInteraction)
{
	var target: User = cmd.options.getUser("user");
	if (!target) target = cmd.user;

	const introURL = await Profiles.FetchUserData(target.id, "Introduction Message");

	if (introURL ?? "" == "")
	{
		cmd.reply({ embeds: [{
			author: Authors.Error,
			description: "We could not load an introduction message for that user."
		}], ephemeral: true })
	}
	else
		cmd.reply({ embeds:[{
			author: Authors.Help,
			description: "You can find the original [introduction message here](" + introURL + ")",
		}], components: Buttons.ToRows(Buttons.Link({
			label: "Original Message",
			url: introURL,
		})), ephemeral: true });
}