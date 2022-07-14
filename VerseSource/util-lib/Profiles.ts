import { MessageEmbedOptions, ColorResolvable } from "discord.js";
import { Fetch } from "./FetchWrapper";
import { SheetsHelpers } from "./GoogleAPIs";
import { Authors, GetRoleInfo } from "./Consts";
import { ToColor } from "./util";
import { Debug } from '../Logging';

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
		"Introduction Message": 10
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

	async function GetUserIndex(user_id: string): Promise<number>
	{
		var index = cache.get(user_id);
		if (index) return index;

		let users = await SheetsHelpers.ReadCol(
			SheetsHelpers.toBase26(Headers["User ID"]), "Profiles");
		index = users.findIndex(u => u == user_id);

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

	export async function SetUserData<T extends keyof typeof Headers>(user_id: string, col: T, data: string)
	{
		let index = await GetUserIndex(user_id);

		if (index < 0)
			return false;

		await SheetsHelpers.UpdateCell(
			data,
			`${SheetsHelpers.toBase26(Headers[col])}${index + 1}`,
			"Profiles"
		);
		return true;
	}

	function ColumnGet<T extends keyof typeof Headers>(key: T, data: string[])
	{
		return (data.length <= Headers[key] || data[Headers[key]] == "") ? `<${key}>` : data[Headers[key]];
	}

	export const isProfileSetup = async (uid: string) => {
		var data = await FetchAllUserData(uid);
		if (!data) return false;
	
		var done = true;
		for (var key = Headers["Full Name"]; key <= Headers["GitHub Username"]; key++)
			done = done && data[key] && data[key] != "";
		return done;
	}

	export async function LoadEmbed_Personal(user_id: string, server: boolean = false): Promise<MessageEmbedOptions>
	{
		const [data, mem] = await Promise.all([
			FetchAllUserData(user_id),
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