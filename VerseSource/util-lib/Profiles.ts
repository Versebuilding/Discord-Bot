import { MessageEmbedOptions, ColorResolvable } from "discord.js";
import { Fetch } from "./FetchWrapper";
import { SheetsHelpers } from "./GoogleAPIs";
import { Authors, GetRoleInfo } from "./VerseMacros";
import { ToColor } from "./util";
import { Debug } from '../Logging';
import * as assert from 'assert';

export namespace Profiles
{
	const cache = new Map<string, number>();

	export const Headers = {
		"User ID": 0,
		"Full Name": 1,
		"Pronouns": 2,
		"Phone Number": 3,
		"Email": 4,
		"Bio": 5,
		"Location": 6,
		"Timezone": 7,
		"Color": 8,
		"GitHub Username": 9,
		"Introduction Message": 10,
		"NULL": 11, // 11 is empty for now
		"Messages": 12,
		"Reactions": 13,
		"Fast Reactions": 14,
		"Online Time": 15,
		"Idle Time": 16,
		"DND Time": 17,
		"Offline Time": 18,
		"VC Time": 19,
		"Events Attended": 20,
		"Time in Events": 21,
		"Last to Leave": 22,
		"Commands Used": 23,
		"Buttons Used": 24,
		"Message Edits": 25,
		"Message Deletes": 26,
	};

	export const findHeader = (num: number)
		: keyof typeof Headers | undefined => Object.entries(Headers).find(([str, n]) => n == num)[0] as keyof typeof Headers;

	export function MapHeaders<T extends keyof typeof Headers>(data: string[], starting_header: T):
		Map<keyof typeof Headers, string>
	{
		const map = new Map<keyof typeof Headers, string>()
		data.forEach((v, i) =>
		{
			if (v != "")
			{
				const header = findHeader(i);
				if (header)
					map.set(header, v);
			}
		});
			
		return map;
	}

	// Resource for the options: https://uwm.edu/lgbtrc/support/gender-pronouns/
	export const Pronouns = [
		`He/Him/His`,
		`She/Her/Her`,
		`They/Them/Their`,
		`Per/Per/Pers`,
		`Xe/Xem/Xyr`,
		`Ve/Ver/Vis`,
		`Ze/Zie/Hir`,
		`E(y)/Em/Eir`,
		`(F)ae/(F)aer/(F)aer`
	];

	async function GetUserIndex(user_id: string, create_user: boolean = false): Promise<number>
	{
		var index = cache.get(user_id);
		if (index) return index;

		let users = await SheetsHelpers.ReadCol(
			SheetsHelpers.toBase26(Headers["User ID"]), "Profiles");
		index = users.findIndex(u => u == user_id);

		if (index == -1 && create_user)
		{
			await SheetsHelpers.UpdateCell(user_id, "A" + (users.length + 1), "Profiles");
			return await GetUserIndex(user_id, false);
		}

		if (index != -1) cache.set(user_id, index);
		return index;
	}

	export async function FetchUserData<T extends keyof typeof Headers>(user_id: string, col: T): Promise<string | null>
	{
		let index = await GetUserIndex(user_id);

		if (index == -1)
		{
			const mem = await Fetch.Member(user_id);
			if (mem)
				Debug.LogWarning("User was not found in table! (id='" + user_id + "', displayName='" + mem.displayName + "')");
			else
				Debug.LogWarning("User was not found in table nor in server! (id=" + user_id + ")");
			return null;
		}
		else return await SheetsHelpers.ReadCell(
			index + 1,
			SheetsHelpers.toBase26(Headers[col]),
			"Profiles",
			process.env.GOOGLE_DATA_DOCUMENT
		);
	}

	export async function FetchUserDataRange<
		T1 extends keyof typeof Headers,
		T2 extends keyof typeof Headers
	>(user_id: string, start_inclusive: T1, end_inclusive: T2): Promise<string[] | null>
	{
		let index = await GetUserIndex(user_id);

		if (index == -1)
		{
			const mem = await Fetch.Member(user_id);
			if (mem)
				Debug.LogWarning("User was not found in table! (id='" + user_id + "', displayName='" + mem.displayName + "')");
			else
				Debug.LogWarning("User was not found in table nor in server! (id=" + user_id + ")");
			return null;
		}
		else return (await SheetsHelpers.Read({
			range: `Profiles!${SheetsHelpers.toBase26(Headers[start_inclusive])}${index + 1}:${SheetsHelpers.toBase26(Headers[end_inclusive])}${index + 1}`,
		}))?.[0] ?? null;
	}

	export async function FetchAllUserData(user_id: string): Promise<string[] | null>
	{
		let index = await GetUserIndex(user_id);

		if (index == -1)
		{
			const mem = await Fetch.Member(user_id);
			if (mem)
				Debug.LogWarning("User was not found in table! (id='" + user_id + "', displayName='" + mem.displayName + "')");
			else
				Debug.LogWarning("User was not found in table nor in server! (id=" + user_id + ")");
			return null;
		}
		else return await SheetsHelpers.ReadRow(
			index + 1,
			"Profiles",
			process.env.GOOGLE_DATA_DOCUMENT
		);
	}

	export async function SetUserData<T extends keyof typeof Headers>(
		user_id: string,
		col: T,
		data: string,
		create_user: boolean = false
	): Promise<boolean>
	{
		let index = await GetUserIndex(user_id, create_user);

		if (index < 0)
			return false;

		await SheetsHelpers.UpdateCell(
			data,
			`${SheetsHelpers.toBase26(Headers[col])}${index + 1}`,
			"Profiles"
		);
		return true;
	}

	export async function IncrementPairCell<T extends keyof typeof Headers>(user_id: string, col: T, amount: number = 1, create_user: boolean = true)
	{
		const current = await Profiles.FetchUserData(user_id, col);

		var new_value: string;
		if (current == null || current == "")
		{
			new_value = "0|" + amount;
		}
		else
		{
			let vals = current.split("|");
			new_value = vals[0] + "|" + (parseInt(vals[1]) + amount);
		}

		return await Profiles.SetUserData(user_id, col, new_value, create_user);
	}

	function ColumnGet<T extends keyof typeof Headers>(key: T, data: string[])
	{
		return (data.length <= Headers[key] || data[Headers[key]] == "") ? `<${key}>` : data[Headers[key]];
	}

	export const isProfileSetup = async (uid: string) => {
		var data = await FetchUserDataRange(uid, "User ID", "GitHub Username");
		if (!data) return false;
	
		var done = true;
		for (var key = Headers["Full Name"]; key <= Headers["GitHub Username"]; key++)
			done = done && data[key] && data[key] != "";
		return done;
	}

	export async function LoadEmbed_Personal(user_id: string, server: boolean = false): Promise<MessageEmbedOptions>
	{
		const [data, mem] = await Promise.all([
			FetchUserDataRange(user_id, "User ID", "GitHub Username"),
			Fetch.Member(user_id)
		]);
		
		if (!data || !mem) return {
			author: Authors.Error,
			description: mem ?
				`Member <@${mem.user.id}> does not have a profile set up.` :
				"Internal error: Member could not be found!"
		};

		const fullName = ColumnGet("Full Name", data);
		const pronouns = ColumnGet("Pronouns", data);
		const cell = ColumnGet("Phone Number", data);
		const email = ColumnGet("Email", data);
		const bio = ColumnGet("Bio", data);
		const location = ColumnGet("Location", data);
		const timezone = ColumnGet("Timezone", data);		
		const github = ColumnGet("GitHub Username", data);
		const sheet_color = ColumnGet("Color", data);
		const color: ColorResolvable = (sheet_color != "Color") ? ToColor(sheet_color) ?? "RANDOM" : "RANDOM";
		const introMsg = ColumnGet("Introduction Message", data);

		const roles = mem.roles.cache.map(r => {
			let ri = GetRoleInfo(r.id)?.[1];
			let name = (server) ? `<@&${r.id}>` : r.name;
			if (ri)
				return ri.emoji + ":" + name;
			else return name;
		}).join(" - ");

		return {
			author: {
				name: `${fullName} (${pronouns}) -- ${mem.user.tag}`,
				iconURL: mem.displayAvatarURL()
			},
			color: color,
			title: `${ (mem.displayName != fullName) ? mem.nickname ?? "<Server Nickname>": mem.displayName }`,
			description: [
				["👔 Bio", bio],
				["🗺️ Location", location],
				["🌄 Timezone", timezone],
				["☎️ Phone Number", cell],
				["📧 Email", email],
				["<:github:979281491903266826> GitHub Username", github],
			].map(([k, v]) => `**${k}**: \`${v}\``).join("\n") +
				"\n⚙️ **Roles**: " + roles,
		}
	}
}