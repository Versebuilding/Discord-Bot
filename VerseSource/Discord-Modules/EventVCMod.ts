import { GuildScheduledEvent, Message, VoiceChannel, VoiceState } from "discord.js";
import * as assert from "assert";
import { Debug } from "../Logging";
import { Channels, ClientHelper, Fetch, Filters, msToTime, VM } from "../util-lib";

const JamArea = "865236289456832563";

ClientHelper.on("messageCreate", OnMSG_EventNote, Filters.Channels([Channels.event_notifications]));
ClientHelper.on("messageUpdate", OnMSG_EventNote, Filters.Channels([Channels.event_notifications]));
ClientHelper.on("messageDelete", OnMSG_EventNote, Filters.Channels([Channels.event_notifications]));
ClientHelper.on("voiceStateUpdate", OnVoiceStateUpdate);

async function OnMSG_EventNote(msg: Message)
{
	if (msg.author.id != VM.ChronicleBotId)
	{
		Debug.LogWarning("Event Notification message from non-Chronicle Bot: " + msg.author.username + ", " + msg.url);
		return;
	}

	if (!msg.embeds || msg.embeds.length == 0)
	{
		Debug.LogWarning("Event Notification message does not have an embed: " + msg.url);
		return;
	}

	if (!msg.embeds[0].author)
	{
		Debug.Log("Event Notification message does not have an author (likely a weekly events message) " + msg.url);
		return;
	}

	UpdateEventVCs();
}

function StringFromLocation(loc: string)
{
	return loc.substring(3).trim().replace("Jam Room", "Jam-Room");
}


// var nextUpdate: {
// 	timeout: NodeJS.Timeout | null;
// 	time: number;
// } = {
// 	timeout: null,
// 	time: Number.MAX_SAFE_INTEGER,
// };

async function UpdateEventVCs()
{
	Debug.LogEvent("Updating event VCs");

	// if (nextUpdate.timeout)
	// {
	// 	clearTimeout(nextUpdate.timeout);
	// 	nextUpdate.timeout = null;
	// }
	// nextUpdate.time = Number.MAX_SAFE_INTEGER;

	// Fetch events can active VCs
	const guild = await Fetch.Guild();
	const [events, activeChannels] = await Promise.all([
		guild.scheduledEvents.fetch()
			// Filter out events that are not external
			.then(events => events
				.map(evt => evt)
				.filter(evt =>
					evt.entityType == "EXTERNAL" &&
					evt.entityMetadata.location?.startsWith("VC:") &&
					evt.scheduledStartAt.getTime() < Date.now() + (22 * 60 * 1000)
				)
			),
		guild.channels.fetch()
			.then(chs => chs.filter(Filters.IsEventVC))
			.then(chs => chs.map(ch => ch as VoiceChannel)),
	]);

	for await (const event of events)
	{
		const locationChannelName = StringFromLocation(event.entityMetadata.location ?? "");
		const channel_index = activeChannels.findIndex(ch => ch.name == locationChannelName);
		const channel = channel_index != -1 ? activeChannels[channel_index] : undefined;
		if (channel_index != -1)
			activeChannels.splice(channel_index, 1);

		if (event.status == "COMPLETED" || event.status == "CANCELED")
		{
			if (channel?.members.size == 0)
			{
				Debug.Log("Event " + event.name + " is completed or canceled and the channel is empty. Deleting channel.");
				await channel.delete();
			}
		}
		else
		{
			if (event.scheduledEndAt)
			{
				// nextUpdate.time = Math.min(nextUpdate.time, event.scheduledEndAt.getTime() - Date.now());
				// Debug.Log("Event " + event.name + " is not completed or canceled and has a end time. Next update in " + msToTime(nextUpdate.time));
				if (!channel)
				{
					Debug.Log("Event " + event.name + " is not completed or canceled and has a end time but no channel yet. Creating channel.");
					await guild.channels.create(locationChannelName, {
						type: "GUILD_VOICE",
						parent: JamArea,
					});
				}
			}
			else
			{
				Debug.LogWarning("Event " + event.name + " has no end time (but has requested a VC). Skipping.");
			}
		}
	}

	for await (const ch of activeChannels)
	{
		if (ch.members.size == 0)
		{
			Debug.LogWarning("Found active channel that is not an event: '" + ch.name + "'. Deleting.");
			await ch.delete();
		}
	}

	// if (nextUpdate.time != Number.MAX_SAFE_INTEGER)
	// {
	// 	Debug.Log("Next Event VC update in " + msToTime(nextUpdate.time));
	// 	nextUpdate.timeout = setTimeout(UpdateEventVCs, nextUpdate.time);
	// }
}
function OnVoiceStateUpdate(oldState: VoiceState, newState: VoiceState)
{
	if (oldState.channel?.parent?.id != JamArea || oldState.channel?.name.startsWith("Jam Room"))
		return;

	Debug.Log("Voice state update is leaving a event VC");
	if (oldState.channel.members.size == 0)
	{
		Debug.Log("Voice state update is leaving the last member of a event VC");
		UpdateEventVCs();
	}
}


// Force update on ready.
ClientHelper.on("ready", UpdateEventVCs);