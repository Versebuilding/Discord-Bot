import { Client } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

export abstract class DiscordModule
{
	abstract Initialize(client: Client);
	GetCommands(): SlashCommandBuilder[] { return [] };
};