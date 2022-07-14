import { Debug } from "../Logging";
import { PreviewMessage, ClientHelper } from "../util-lib";


ClientHelper.on("ready", async () => {
	Debug.Endl();
	Debug.LogEvent("Client Ready", `Logged in as ${ClientHelper.client.user.tag}!`)
});

ClientHelper.client.on("interactionCreate", i =>
{
	Debug.Endl();
	if (i.isCommand())
		Debug.LogEvent("Command Received", `{ user: ${i.user.username}, cmd: ${i.commandName} }`);
	else if (i.isButton())
		Debug.LogEvent("Button Received", `{ user: ${i.user.username}, btnId: ${i.customId}, ` + 
			`label: "${i.component.label}" }`)
	else if (i.isModalSubmit())
		Debug.LogEvent("Modal Received", `{ user: ${i.user.username}, modId: ${i.customId} }`)
	else
		Debug.LogEvent("Unknown Interaction", `{ user: ${i.user.username} }`)
});

ClientHelper.on("messageCreate", async msg => {
	if (!msg.author.bot)
	{
		Debug.Endl();
		Debug.LogEvent("Message Received", "{ user: " + msg.author.username +
			`, msg_id: ${msg.id}, preview: "${PreviewMessage(msg)}" }`);
	}
});

