import { Client } from "discord.js";
import { DiscordModule } from "./DiscordModule";
import { PreviewMessage, Debug } from "../util-lib";

export class LoggingMod extends DiscordModule
{
	log = "";

	Initialize(client: Client<boolean>)
	{
		client.on("interactionCreate", interaction =>
			Debug.Log(`>>Interaction Recieved<< User: ${interaction.user.username}`));
		client.on("ready", () =>
			Debug.Log(`>>Client is Ready<< Logged in as ${client.user.tag}!`));
		client.on("messageCreate", msg =>
			Debug.Log(`>>Message Recieved<< Author: ${msg.author.username},
				msg_id: ${msg.id}, preview: "${PreviewMessage(msg)}"`));
		client.on("messageReactionAdd", async (reaction, user) => {
			if (reaction.partial) reaction.fetch();
			if (user.partial) user.fetch();
			Debug.Log(`>>Message Recieved<< emoji: ${reaction.emoji}, user: ${user.username},
				msg_id: ${reaction.message.id}, msg_preview: "${PreviewMessage(await reaction.message.fetch())}"`)
		});
	}

	GetLog(): string
	{
		return this.log;
	}
}