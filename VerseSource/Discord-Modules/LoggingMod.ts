import { SlashCommandBuilder } from "@discordjs/builders";
import { Debug } from "../Logging";
import { PreviewMessage, ClientHelper, Filters, Authors } from "../util-lib";


ClientHelper.on("ready", async () => {
	Debug.Endl();
	Debug.LogEvent("Client Ready", `Logged in as ${ClientHelper.client.user.tag}!`)
});

ClientHelper.client.on("interactionCreate", i =>
{
	Debug.Endl();
	if (i.isCommand())
		Debug.LogEvent("Command Received", `${i.user.username}, cmd: ${i.commandName} }`);
	else if (i.isButton())
		Debug.LogEvent("Button Received", `${i.user.username}, btnId: ${i.customId}, ` + 
			`label: ${i.component.label}`)
	else if (i.isModalSubmit())
		Debug.LogEvent("Modal Received", `${i.user.username}, modId: ${i.customId} }`)
	else
		Debug.LogEvent("Unknown Interaction", `${i.user.username}`)
});

ClientHelper.on("messageCreate", async msg => {
	if (msg.author.id != ClientHelper.client.user.id)
	{
		Debug.Endl();
		Debug.LogEvent("Message Received", msg.author.username +
			`: "${PreviewMessage(msg)}"`);
	}
});

ClientHelper.on("messageUpdate", async msg => {
	if (msg.author.id != ClientHelper.client.user.id)
	{
		Debug.Endl();
		Debug.LogEvent("Message Updated", msg.author.username +
			`: "${msg.url}"`);
	}
});

ClientHelper.on("messageDelete", async msg => {
	if (msg.author.id != ClientHelper.client.user.id)
	{
		Debug.Endl();
		Debug.LogEvent("Message Deleted", msg.author.username);
	}
});

ClientHelper.on("voiceStateUpdate", async (oldState, newState) =>
{
	Debug.Endl();
	Debug.LogEvent("Voice State Changed",
		`${oldState?.member ? oldState.member.displayName : newState?.member?.displayName}, from ${oldState?.channel?.name} to ${newState?.channel?.name}`
	);
})

ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName("print-log")
	.setDescription("Prints the tail end of the bot's log."),
	async (i) =>
	{
		await i.reply({
			embeds: [{
				author: Authors.Core,
				title: "Bot Log:",
			}],
			ephemeral: true
		});
		var log = Debug.GetLog();
		Debug.Log(log);
		for (let index = 0; index < log.length; index += 3000)
		{
			let current_print = log.substring(index, Math.min(log.length, index + 3000));

			await i.followUp({
				embeds: [{
					description: current_print,
				}],
				ephemeral: true
			});
		}
		
	},
	Filters.iModeratorAuth()
)

ClientHelper.on("userUpdate", async (oldUser, newUser) =>
{
	Debug.Endl();
	Debug.LogEvent("User Updated", "From: ", oldUser, "To: ", newUser);
});

ClientHelper.on("presenceUpdate", async (oldPresence, newPresence) =>
{
	if (oldPresence?.status == newPresence?.status) return;

	const user =
		oldPresence?.member?.displayName ??
		newPresence?.member?.displayName ??
		oldPresence?.user?.username ??
		newPresence?.user?.username ??
		oldPresence?.userId ??
		newPresence?.userId;

	Debug.LogEvent("Presence Updated", `${user}: ${oldPresence?.status ?? "undefined"} -> ${newPresence?.status ?? "undefined"}`);
});