import { DiscordModule } from "./DiscordModule";
import { PreviewMessage, Debug, ClientHelper } from "../util-lib";

export class LoggingMod extends DiscordModule
{
	Initialize()
	{
		ClientHelper.on("ready", async () =>
			Debug.Log(`\n>>Client is Ready<< Logged in as ${ClientHelper.client.user.tag}!`));

		ClientHelper.client.on("interactionCreate", i =>
		{
			console.log(`locale of interaction: ${i.locale}`);
			if (i.isCommand())
				Debug.Log(`\n>>Command Recieved<< { user: ${i.user.username}, cmd: ${i.commandName} }`);
			else if (i.isButton())
				Debug.Log(`\n>>Button Recieved<< { user: ${i.user.username}, btnId: ${i.customId}, ` + 
					`label: "${i.component.emoji} ${i.component.label}" }`)
			else if (i.isModalSubmit())
				Debug.Log(`\n>>Modal Recieved<< { user: ${i.user.username}, modId: ${i.customId} }`)
			else
				Debug.Log(`\n>>Unknown Interaction<< { user: ${i.user.username} }`)
		});
		
		ClientHelper.on("messageCreate", async msg => { if (!msg.author.bot)
			Debug.Log("\n>>Message Recieved<< { user: " + msg.author.username +
				`, msg_id: ${msg.id}, preview: "${PreviewMessage(msg)}" }`);});
	}
}