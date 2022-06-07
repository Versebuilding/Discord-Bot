import { Client, Interaction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscordModule } from "./DiscordModule";

async function OnInteraction(interaction: Interaction)
{
	if (!interaction.isCommand()) return;
	if (interaction.commandName === 'ping')
		await interaction.reply({ content: 'Pong!', ephemeral: true });

	else if (interaction.commandName === 'listmembers')
	{
		let content = "";

		const role = interaction.options.getRole('role');

		// Only used to update list of users.
		await interaction.guild.members.fetch();

		const users = interaction.guild.roles.cache.get(role.id).members.map(m => m.user.id);
		users.forEach(u => content += `<@${u}>, `);

		if (content == "") content = "No members were found.";
		else content = content.substring(0, content.length - 2);
		await interaction.reply({ content: `<@&${role.id}>-> ${content}`, ephemeral: true });
	}
}

export class CoreMod extends DiscordModule
{
	Initialize(client: Client<boolean>)
	{
		client.on("interactionCreate", OnInteraction);
	}

	GetCommands(): SlashCommandBuilder[]
	{
		let cmds = [];
		for (let i = 0; i < 2; i++) cmds.push(new SlashCommandBuilder());

		cmds[0].setName('ping')
			.setDescription('Replies with Pong!');

		cmds[1].setName('listmembers')
			.setDescription('Converts any times in given text into Discord timezone commands!')
			.addRoleOption(option =>
				option.setName('role')
					.setDescription('The input to be parsed for times')
					.setRequired(true))

		return cmds;
	}
}