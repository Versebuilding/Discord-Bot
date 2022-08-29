import { ActivitiesOptions } from "discord.js";
import { Debug } from "../Logging";
import { ClientHelper } from "../util-lib";

const options: ActivitiesOptions[] = [
	{
		name: "Moderator",
		type: "PLAYING",
	},
	{
		name: "The Verse",
		type: "WATCHING"
	},
	{
		name: "Prosocial Development",
		type: "LISTENING"
	},
	{
		name: "Invisible Helper",
		type: "STREAMING"
	},
	{
		name: "Best Bot Ever",
		type: "COMPETING"
	},
	{
		name: "Data Management",
		type: "PLAYING"
	},
	{
		name: "Creators Create",
		type: "WATCHING"
	},
	{
		name: "Innovative Discussions",
		type: "LISTENING"
	},
	{
		name: "Self-reflection",
		type: "PLAYING"
	}
]

const idleMessage: ActivitiesOptions = {
	name: "Silence",
	type: "LISTENING",
};

var currentStatus: number = -1;
var lastNumberUses: number = -1;

function GetNewStatus(current_uses: number): ActivitiesOptions
{
	if (lastNumberUses == current_uses)
	{
		currentStatus = -1;
		ClientHelper.OnNextUse(UpdateStatus);
		return idleMessage;
	}

	let max = (currentStatus == -1) ? options.length : (options.length - 1)
	var randVal = Math.floor(Math.random() * max);
	if (randVal >= currentStatus)
		if (randVal == options.length - 1)
			randVal = 0;
		else
			randVal++;

	currentStatus = randVal;
	return options[randVal];
}

function UpdateStatus()
{
	const currentUses = ClientHelper.onlineEvents.reduce((acc, x) => acc + ClientHelper.GetUses(x), 0);
	// Client is idle/crashed, don't update status.
	if ((currentStatus == -1 && currentUses == lastNumberUses) || ClientHelper.crashed)
		return;

	ClientHelper.client.user?.setPresence({
		activities: [
			GetNewStatus(currentUses)
		],
		status: (currentStatus == -1) ? "idle" : "online",
		afk: false,
	});

	lastNumberUses = currentUses;
	Debug.Log("Status updated: " + (currentStatus == -1 ? "Idle" : "Active") + " (" + currentUses + " uses)");
}

ClientHelper.on("ready", () =>
{
	UpdateStatus();
	setInterval(UpdateStatus, 600000);
});