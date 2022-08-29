import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, ClientPresenceStatus, Interaction, ButtonInteraction, ReactionCollector, GuildMember, Guild, NonThreadGuildBasedChannel, Channel, GuildTextBasedChannel, Role, CategoryChannel } from "discord.js";
import { Debug } from "../Logging";
import { ClientHelper, Fetch, Filters, Profiles, Roles, SheetsHelpers } from "../util-lib";

// CONFIGURATION
const fastReactionTime = 1000 * 60 * 10;
const lastToLeaveMinTime = 1000 * 60 * 5;
const lastToLeaveMinSize = 4;

/** The amount of time that must past between messages of the same author in order for the messages to count as two messages. */
const backToBackMessageSeparatorTime = 1000 * 60 * 7;

// Setup
const statusMap = new Map<string, [status: ClientPresenceStatus, time: number]>();
const vcMap = new Map<string, [channel: string, time: number]>();
const eventAttendance = new Map<string, Set<string>>();
const lastToLeave = new Set<string>();
const reactionCollectors = new Set<ReactionCollector>();


ClientHelper.on("ready", async () =>
{
	const members = await Fetch.Guild().then(g => g.members.fetch());
	const now = Date.now();
	members.forEach(m =>
	{
		if (m.presence?.status && m.presence.status != "offline" && m.presence.status != "invisible")
			statusMap.set(m.id, [m.presence.status, now]);
		
		if (m.voice?.channel?.id)
			vcMap.set(m.id, [m.voice.channel.id, now]);
	});

	const presenceTimeout = setTimeout(SYNC_FlushPresenceData, 1000 * 60 * 11);

	ClientHelper.OnCrash(() =>
	{
		clearTimeout(presenceTimeout);
		SYNC_FlushPresenceData();
		SYNC_FlushVCData();
		eventAttendance.forEach((value, key) =>
		{
			value.forEach(userId =>
			{
				Profiles.IncrementPairCell(userId, "Events Attended");
			});
		});
		eventAttendance.clear();
		reactionCollectors.forEach(c => c.stop("Crash"));
	});
});

// Commands

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("insights-print-all")
		.setDescription("Responds with a message with all of the profile insights."),
	OnCMD_InsightsPrintAll,
	Filters.iModeratorAuth()
);

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("insights-clear-weekly")
		.setDescription("Clears the weekly insights."),
	CMD_FlushWeek,
	Filters.iModeratorAuth()
);

async function OnCMD_InsightsClearWeekly(cmd: CommandInteraction)
{

}

// Data Trackers

ClientHelper.on("messageCreate", async msg =>
{
	await Promise.all([
		FastReactions(msg)
	]);
});

ClientHelper.on("voiceStateUpdate", async (oldState, newState) =>
{
	if (oldState.channel && oldState.channel.members.size >= lastToLeaveMinSize)
		lastToLeave.add(oldState.channel.id);
	if (newState.channel && newState.channel.members.size >= lastToLeaveMinSize)
		lastToLeave.add(newState.channel.id);

	if (oldState?.member?.user?.bot || oldState?.member?.user?.bot) return;
	
	// Voice update did not affect channel id
	if (oldState?.channelId == newState?.channelId) return;

	const userId = oldState?.member?.id ?? newState?.member?.id;

	if (!userId) return;

	const now = Date.now();

	const oldStatus = vcMap.get(userId);

	if (oldStatus)
	{
		vcMap.delete(userId);
		Profiles.IncrementPairCell(userId, "VC Time", now - oldStatus[1]);

		if (oldStatus[0] != oldState?.channelId)
		{
			Debug.LogError("VC update mismatch: " + userId + " -> (saved) " + oldStatus[0] + ", (given) " + oldState?.channelId);
		}
		else if (!oldState.channel)
		{
			Debug.LogError("Old state channel is null but channel id somehow matched old state.");
		}
		else
		{
			if (Filters.IsEventVC(oldState.channel))
			{
				Profiles.IncrementPairCell(userId, "Time in Events", now - oldStatus[1]);
			}

			if (oldState.channel.members.size == 0 &&
				lastToLeave.delete(oldState.channelId) &&
				(now - oldStatus[1] > lastToLeaveMinTime))
			{
				Profiles.IncrementPairCell(userId, "Last to Leave");
			}
		}
	}

	if (newState?.channelId)
	{
		eventAttendance.get(newState.channelId)?.add(userId);
		vcMap.set(userId, [newState?.channelId, now]);
	}
});

ClientHelper.on("messageUpdate", async (oldMsg, newMsg) =>
{
	var userId = oldMsg?.member?.id ?? newMsg?.member?.id;
	if (userId)
		Profiles.IncrementPairCell(userId, "Message Edits");
	
});

ClientHelper.on("messageDelete", async (msg) =>
{
	var userId = msg?.member?.id;
	if (userId)
		Profiles.IncrementPairCell(userId, "Message Deletes");
	
});

ClientHelper.reg_btn(null, async (interaction: ButtonInteraction) =>
{
	Profiles.IncrementPairCell(interaction.user.id, "Buttons Used");
});

ClientHelper.reg_cmd(null, async (interaction: CommandInteraction) =>
{
	Profiles.IncrementPairCell(interaction.user.id, "Commands Used");
});


ClientHelper.on("channelCreate", async channel =>
{
	if (Filters.IsEventVC(channel))
	{
		eventAttendance.set(channel.id, new Set<string>());
	}
});

ClientHelper.on("channelDelete", async channel =>
{
	// Try to do the following.
	eventAttendance.get(channel.id)?.forEach(userId =>
	{
		Profiles.IncrementPairCell(userId, "Events Attended");
	});
	eventAttendance.delete(channel.id);
});

ClientHelper.on("presenceUpdate", async (oldPresence, newPresence) =>
{
	if (oldPresence?.user?.bot || newPresence?.user?.bot) return;

	const now = Date.now();

	const userId = oldPresence?.userId ?? newPresence?.userId;

	// Presence update did not affect status
	if (oldPresence?.status == newPresence?.status) return;

	// Presence update was from offline to offline (one was invisible)
	if (oldPresence?.status == "offline" || oldPresence?.status == "invisible")
		if (newPresence?.status == "offline" || newPresence?.status == "invisible")
			return;

	const oldStatus = statusMap.get(userId);

	if (oldStatus)
	{
		const col =
			oldStatus[0] == "online" ? "Online Time" :
			oldStatus[0] == "idle" ? "Idle Time" :
			"DND Time";

		await Profiles.IncrementPairCell(userId, col, now - oldStatus[1]);
		statusMap.delete(userId);
		if (oldStatus[0] != oldPresence?.status)
		{
			Debug.LogError("Presence update mismatch: " + userId + " -> (saved) " + oldStatus[0] + ", (given) " + oldPresence?.status);
		}
	}

	if (newPresence?.status && newPresence.status != "offline" && newPresence.status != "invisible")
		statusMap.set(userId, [newPresence?.status, now]);
});

async function CMD_FlushWeek(cmd: CommandInteraction)
{
	cmd.deferReply({ ephemeral: true });
	const range = `Profiles!${SheetsHelpers.toBase26(Profiles.Headers["Fast Reactions"])}2:${SheetsHelpers.toBase26(Profiles.Headers["Message Deletes"])}5000`;
	var data = await SheetsHelpers.Read({
		range: range,
	});

	for (const row of data)
	{
		for (let i = 0; i < row.length; i++)
		{
			if (!row[i] || row[i] == "")
				row[i] = "0|0";

			const spl = row[i].split("|");
			row[i] = `${parseInt(spl[0]) + parseInt(spl[1])}|0`;
		}
	}

	await SheetsHelpers.Update({
		requestBody: { values: [ data ]},
		range: range,
	});

	cmd.followUp({ content: "Done.", ephemeral: true });
}

function SYNC_FlushPresenceData()
{
	const now = Date.now();
	statusMap.forEach((status, userId) =>
	{
		const col =
			status[0] == "online" ? "Online Time" :
			status[0] == "idle" ? "Idle Time" :
			"DND Time";

		Profiles.IncrementPairCell(userId, col, now - status[1]);
		status[1] = now;
	});
}

function SYNC_FlushVCData()
{
	const now = Date.now();
	vcMap.forEach((status, userId) =>
	{
		Profiles.IncrementPairCell(userId, "VC Time", now - status[1]);

		if (eventAttendance.has(status[0]))
		{
			Profiles.IncrementPairCell(userId, "Time in Events", now - status[1]);
		}

		status[1] = now;
	});
}

async function FastReactions(msg: Message)
{
	if (msg.channel.type == "DM") return;

	const collector = msg.createReactionCollector({ time: fastReactionTime });

	collector.on("end", async (collected, reason) =>
	{
		const users: Set<string> = new Set();

		collected.forEach(r =>
			r.users.cache.forEach(
				u => users.add(u.id)));
		
		if (reason == "crash")
			users.forEach(u => Profiles.IncrementPairCell(u, "Fast Reactions", 1, false));

		for await (const uid of users)
		{
			const wasSet = await Profiles.IncrementPairCell(uid, "Fast Reactions");
			if (!wasSet)
				Debug.LogError("Failed to set sheets Fast Reactions for user " + uid);
		}
		Debug.Log("Reaction collector ended: " + reason);
		reactionCollectors.delete(collector);
	});

	reactionCollectors.add(collector);
}


// Data Processors
/*
class CategoryInsight
{
	readonly category: CategoryChannel | null;

	channels = new Map<string, ChannelInsight>();

	constructor(category?: CategoryChannel | null)
	{
		this.category = category;
	}

	static MapFrom(channels: GuildTextBasedChannel[])
	{
		const result = new Map<string, CategoryInsight>();
		channels.forEach(c =>
		{
			var channelParentName = c.parent?.parent?.name ?? c.parent?.name ?? c.guild.name;

			var cat = result.get(channelParentName);
			if (!cat)
				cat = result.set(
					channelParentName,
					new CategoryInsight(c.parent?.parent ?? (c.parent as CategoryChannel) ?? null)
				).get(channelParentName);
			cat.channels.set(c.name, new ChannelInsight(c));
		});
	}
}

class ChannelInsight
{
	readonly channel: GuildTextBasedChannel;

	messages = new Map<string, MessageInsight>();
	reactions: number;

	constructor(channel: GuildTextBasedChannel)
	{
		this.channel = channel;
	}

	async Populate(timeCutoff: number)
	{
		this.messages = new Map<string, MessageInsight>();

		var msgPointer: string | undefined = undefined;
		do {
			await this.channel.messages.fetch({ limit: 100, before: msgPointer }).then(ms =>
			{
				msgPointer = (ms.last()?.createdTimestamp < timeCutoff) ? ms.last()?.id : undefined;
				ms.forEach(m =>
				{
					if (m.createdTimestamp < timeCutoff)
						this.messages.set(m.id, new MessageInsight(m));
				})
			});
		} while (msgPointer);
	}
}

class MessageInsight
{
	readonly message: Message;
	readonly ats_used: number;
	readonly user_ats: Set<string>;
	readonly role_ats: Set<string>;

	constructor(message: Message)
	{
		this.message = message;

		const message_ats = new Set(this.message.content?.match(/<@&?[0-9]{18,21}>/gim));
		this.user_ats = new Set();
		this.role_ats = new Set();
		this.ats_used = message_ats.size;

		for (const id of message_ats)
		{
			if (id.charAt(3) != "&")
			{
				this.user_ats.add(id.slice(2, -1));
			}
			else
			{
				this.role_ats.add(id.slice(3, -1));
			}
		}
	}
}

class MemberInsight
{
	readonly member: GuildMember;

	sheetData: Map<keyof typeof Profiles.Headers, string>;
	messages_sent: number = 0;
	used_reactions: number[] = [];
	gotten_reactions: number[] = [];
	first_responder_to_at: number = 0;
	times_direct_ated: number = 0;
	times_indirect_ated: number = 0;
	back_to_back_messages: number[] = [];

	constructor(member: GuildMember)
	{
		this.member = member;
	}

	async Populate()
	{
		this.sheetData = await Profiles.FetchUserDataRange(this.member.id, "Fast Reactions", "Message Deletes")
			.then(data => Profiles.MapHeaders(data, "Fast Reactions"));
	}
}

class RoleInsight
{
	role: Role;
	times_ated: number = 0;

	// members_with_role: number = 0;

	constructor(role: Role)
	{
		this.role = role;
	}
}

class OutstandingOf<T>
{
	readonly size: number;
	readonly indices: [count: number, object: T][];

	constructor(size: number = 3)
	{
		this.size = size;
		for (let i = 0; i < size; i++)
		{
			this.indices.push([i, null as any]);
		}
	}

	InsertMax(count: number, object: T)
	{
		for (let i = 0; i < this.size; i++)
		{
			if (count > this.indices[i][0])
			{
				this.indices.splice(i, 0, [count, object]);
				this.indices.pop();
				return;
			}
		}
	}

	InsertMin(count: number, object: T)
	{
		for (let i = 0; i < this.size; i++)
		{
			if (count < this.indices[i][0])
			{
				this.indices.splice(i, 0, [count, object]);
				this.indices.pop();
				return;
			}
		}
	}
}

class WeeklyInsight
{
	readonly lastWeek: number;
	readonly guild: Guild;

	channel_data: Map<string, ChannelInsight>;
	member_data: Map<string, MemberInsight>;
	role_data: Map<string, RoleInsight>;

	messages_sent: number = 0;
	message_reactions: number = 0;
	messages_most_reactions = new OutstandingOf<Message>();
	messages_most_ats = new OutstandingOf<Message>();

	constructor(guild: Guild)
	{
		this.lastWeek = Date.now() - 1000 * 60 * 60 * 24 * 7;
		this.guild = guild;
	}

	async Populate()
	{
		const [channels, members, roles] = await Promise.all([
			// Channel data
			this.guild.channels.fetch().then(
				a => a.reduce<GuildTextBasedChannel[]>(
					// Reduce to map and filter to only text channels
					(acc, ch) =>
					{
						if (ch.type == "GUILD_TEXT")
							acc.push(ch as GuildTextBasedChannel);
						return acc;
					}, [])),
			
			// Member data
			this.guild.members.fetch({ force: true }).then(
				mems => mems
					.reduce((acc, m) => acc.set(m.id, new MemberInsight(m)), new Map<string, MemberInsight>())),
			
			// Role data
			this.guild.roles.fetch().then(
				roles => roles
					.reduce((acc, r) => acc.set(r.id, new RoleInsight(r)), new Map<string, RoleInsight>()))
		]);

		await Promise.all([
			// Populate channel data
			...[...this.channel_data.values()].map(c => c.PopulateMessages(this.lastWeek)),
			// Populate member data
			...[...this.member_data.values()].map(m => m.PopulateSheetData())
		]);

		for (const channel_data of this.channel_data.values())
		{
			var lastMessage: {
				authorId?: string;
				createdTimestamp?: number;
				users_ated?: Set<string>;
			} = {};

			for (const message of channel_data.messages)
			{
				const auth_mem = this.member_data.get(message.author.id);
				const reactionCount = message.reactions.cache.reduce((acc, r) =>
				{
					r.users.cache.forEach(u => this.member_data.get(u.id).used_reactions++);
					return acc + r.count;
				}, 0);

				auth_mem.gotten_reactions += reactionCount;
				if (lastMessage?.authorId == message.author.id)
				{
					if (lastMessage?.createdTimestamp > message.createdTimestamp + backToBackMessageSeparatorTime)
						auth_mem.messages_sent++;

					auth_mem.back_to_back_messages++;
				}
					
				
				const users_ated = new Set<string>();
				const message_ats = new Set(message.content?.match(/<@&?[0-9]{18,21}>/gim));
				for (const id of message_ats)
				{
					if (id.charAt(3) != "&")
					{
						users_ated.add(id.slice(2, -1));
					}
					else
					{
						const role = this.role_data.get(id.slice(3, -1));
						if (role)
						{
							role.role.members.forEach(m => users_ated.add(m.id));
							role.times_ated++;
						}
					}
				}

				for (const user of users_ated)
				{
					this.member_data.get(user).times_ated++;
				}

				if (lastMessage?.users_ated.has(message.author.id))
					auth_mem.first_responder_to_at++;

				this.messages_most_reactions.InsertMax(reactionCount, message);
				this.messages_most_ats.InsertMax(message_ats.size, message);

				lastMessage = {
					authorId: message.author.id,
					createdTimestamp: message.createdTimestamp,
					users_ated: users_ated,
				}
			}
		}
	}
}
*/

async function OnCMD_InsightsPrintAll(cmd: CommandInteraction)
{
	
}