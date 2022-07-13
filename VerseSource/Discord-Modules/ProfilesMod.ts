import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, Channel, ColorResolvable, CommandInteraction, GuildBasedChannel, Message, MessageButton, MessageEmbedOptions, MessageOptions, User } from "discord.js";
import { AskTextQuestion, Authors, Buttons, ClientHelper, CloseMessage, COMMON_REGEXPS, Debug, Delegate, Fetch, GetRoleInfo, IconLinks, Roles, SendAcceptNote, SendConfirmation, SheetsHelpers, ToColor } from "../util-lib";
import { DiscordModule } from "./DiscordModule";
import { ProfileColumnHeaders } from "../util-lib/ProfileColumnHeaders";
import { CommandMenus, HelpMenus, MessageMenu } from "./Menus";

// Resource for the options: https://uwm.edu/lgbtrc/support/gender-pronouns/
export const PersonalPronouns = [
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

async function OnCMD_Profile(cmd: CommandInteraction)
{
	var target: User = cmd.options.getUser("user");
	var channel = cmd.options.getChannel("post-to-channel");
	if (!target) target = cmd.user;

	if (channel == null)
		cmd.reply({ embeds:[await ProfilesMod.LoadEmbed_Personal(target.id, true)], ephemeral: true });
	else
	{
		await Fetch.Channel(channel.id).then(async c => {
			if (c.isText())
			{
				await c.send({ embeds:[await ProfilesMod.LoadEmbed_Personal(target.id, true)] });
				await cmd.reply({ embeds: [{ author: Authors.Core, description: "Your message has been sent!" }], ephemeral: true });
			}
			else await cmd.reply({ embeds: [{ author: Authors.Error, description: "The channel you sent is not a text channel!" }], ephemeral: true });
		}).catch(() => cmd.reply({ embeds: [{ author: Authors.Error, description: "There was an error trying to send the message." }], ephemeral: true }));
	}
}

async function OnCMD_Introduction(cmd: CommandInteraction)
{
	var target: User = cmd.options.getUser("user");
	if (!target) target = cmd.user;

	const introURL = await ProfilesMod.GetUserDataByID(target.id, ProfileColumnHeaders["Introduction Message"]);

	if (introURL ?? "" == "")
	{
		cmd.reply({ embeds: [{
			author: Authors.Error,
			description: "We could not load an introduction message for that user."
		}], ephemeral: true })
	}
	else
		cmd.reply({ embeds:[{
			author: Authors.Help,
			description: "You can find the original [introduction message here](" + introURL + ")",
		}], components: Buttons.ToRows(Buttons.Link({
			label: "Original Message",
			url: introURL,
		})), ephemeral: true });
}

export class ProfilesMod extends DiscordModule
{
	Initialize(): void
	{
		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName("profile")
				.setDescription("Display the 'Verse Profile' of a user.")
				.addUserOption(o => o
					.setName("user")
					.setDescription("User that should be displayed. If empty, then shows self.")
					.setRequired(false))
				.addChannelOption(o => o
					.setName("post-to-channel")
					.setDescription("Instead of a private message, you can post this to a channel!")
					.setRequired(false)),
			OnCMD_Profile);

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName("edit-profile")
				.setDescription("Edit your own 'Verse Profile'."),
			CommandMenus.profileSetup.JustDMOpen());

		ClientHelper.reg_cmd(
			new SlashCommandBuilder()
				.setName("introduction")
				.setDescription("Display the company introduction of a user.")
				.addUserOption(o => o
					.setName("user")
					.setDescription("User that should be displayed. If empty, then shows self.")
					.setRequired(false)),
			OnCMD_Introduction);
	}

	static async GetUserDataByID(user_id: string, col: ProfileColumnHeaders): Promise<string>
	{
		let users = await SheetsHelpers.ReadCol(
			SheetsHelpers.toBase26(ProfileColumnHeaders["User ID"]), "Profiles");
		let index = users.findIndex(u => u == user_id);

		if (index == -1)
		{
			const mem = await Fetch.Member(user_id);
			if (mem)
				Debug.Warning("User was not found in table! (id='" + user_id + "', displayName='" + mem.displayName + "')");
			else
				Debug.Warning("User was not found in table nor in server! (id=" + user_id + ")");
			return null;
		}
		else return await SheetsHelpers.ReadCell(index + 1, SheetsHelpers.toBase26(col), "Profiles", process.env.GOOGLE_DATA_DOCUMENT);
	}

	static async GetAllUserDataByID(user_id: string): Promise<string[]>
	{
		let users = await SheetsHelpers.ReadCol(
			SheetsHelpers.toBase26(ProfileColumnHeaders["User ID"]), "Profiles");

		let index = users.findIndex(u => u == user_id);

		if (index == -1)
		{
			const mem = await Fetch.Member(user_id);
			if (mem)
				Debug.Warning("User was not found in table! (id='" + user_id + "', displayName='" + mem.displayName + "')");
			else
				Debug.Warning("User was not found in table nor in server! (id=" + user_id + ")");
			return null;
		}
		else return await SheetsHelpers.ReadRow(index + 1, "Profiles", process.env.GOOGLE_DATA_DOCUMENT);
	}

	static async SetUserDataByID(user_id: string, col: ProfileColumnHeaders, data: string)
	{
		let users = await SheetsHelpers.ReadCol(
			SheetsHelpers.toBase26(ProfileColumnHeaders["User ID"]), "Profiles");
		let index = users.findIndex(u => u == user_id);

		ProfilesMod.SetUserDataByIndex(index, col, data);
	}

	static async SetUserDataByIndex(user_index: number, col: ProfileColumnHeaders, data: string): Promise<boolean>
	{
		if (user_index < 0)
			return false;

		await SheetsHelpers.UpdateCell(
			data,
			`${SheetsHelpers.toBase26(col)}${user_index + 1}`,
			"Profiles");
		return true;
	}

	static ColumnGet(key: ProfileColumnHeaders, data: string[])
	{
		return (data.length <= key || data[key] == "") ? `<${ProfileColumnHeaders[key]}>` : data[key];
	}

	static async LoadEmbed_Personal(user_id: string, server: boolean = false): Promise<MessageEmbedOptions>
	{
		const [data, mem] = await Promise.all([
			ProfilesMod.GetAllUserDataByID(user_id),
			Fetch.Member(user_id)
		]);
		
		if (!data || !mem) return {
			author: Authors.Error,
			description: mem ?
				`Member <@${mem.user.id}> does not have a profile set up.` :
				"Internal error: Member could not be found!"
		};

		const fullName = ProfilesMod.ColumnGet(ProfileColumnHeaders["Full Name"], data);
		const pronouns = ProfilesMod.ColumnGet(ProfileColumnHeaders.Pronouns, data);
		const cell = ProfilesMod.ColumnGet(ProfileColumnHeaders["Phone Number"], data);
		const email = ProfilesMod.ColumnGet(ProfileColumnHeaders.Email, data);
		const bio = ProfilesMod.ColumnGet(ProfileColumnHeaders.Bio, data);
		const location = ProfilesMod.ColumnGet(ProfileColumnHeaders.Location, data);
		const timezone = ProfilesMod.ColumnGet(ProfileColumnHeaders.Timezone, data);		
		const github = ProfilesMod.ColumnGet(ProfileColumnHeaders["GitHub Username"], data);
		const sheet_color = ProfilesMod.ColumnGet(ProfileColumnHeaders.Color, data);
		const color: ColorResolvable = (sheet_color != "Color") ? ToColor(sheet_color) ?? "RANDOM" : "RANDOM";
		const introMsg = ProfilesMod.ColumnGet(ProfileColumnHeaders["Introduction Message"], data);

		const roles = mem.roles.cache.map(r => {
			let ri = GetRoleInfo(r.id)?.[1];
			let name = (server) ? `<@&${r.id}>` : r.name;
			if (ri)
				return ri.emoji + " " + name;
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

/********************************************************/
/*              Set Personal Information                */
/********************************************************/
// const ChangeProfileInfo = new MessageMenu(
// 	"Completed Profile Setup!",
// 	"Exit Profile Setup",
// 	"☑️"
// );

// ChangeProfileInfo.SetMenu({
// 	embeds: [{
// 		author: Authors.Help,
// 		title: "🎆 Your profile looks awesome! 🎆",
// 		description: "However, if you ever need to make changes to it (after applying), you can use the `/edit-profile` command in the server to reopen this menu for editing. You can also use `/profile <user>` to view any Verse Creators profile.\n*Your's and others' profiles can also be accessed through the `/help` menu.*"
// 	}],
// 	components: AddButtonsToRow([
// 		Buttons.Next(PreAppHome.Swap)
// 				.setStyle("SUCCESS")
// 				.setLabel("Understood!"),
// 	])
// });

function CreateAskAndPost(
	key: ProfileColumnHeaders,
	embed: MessageEmbedOptions,
	validate?: Delegate<[Message<boolean>], string | null>
): Delegate<[ButtonInteraction]>
{
	embed.footer = {
		text: "Type your answer as a message in the chat. (type something invalid like '.' to exit)"
	};
	embed.color = "BLURPLE";
	embed.title = ProfileColumnHeaders[key] + " " + embed.title;

	return async (btn) =>
	{
		const def_promise = btn.deferUpdate();
		const answer = await AskTextQuestion({
			content: { embeds: [embed] },
			channel: btn.user,
			validate: validate,
			useTimer: true,
		});

		if (answer)
		{
			await ProfilesMod.SetUserDataByID(btn.user.id, key, answer.content);
		}

		await def_promise;
		CommandMenus.profileSetup.Swap(btn);
	}
}

const personalInfo: [
	key: ProfileColumnHeaders,
	embed: MessageEmbedOptions,
	validate?: Delegate<[Message<boolean>], string | null>][] =
[
	[ ProfileColumnHeaders["Full Name"], {
		title: "<:name_tag:986290647189291008>",
		description: "(First Last) This is the name that we will display for your company profile, mainly on the contributors page and within discord.",
		footer: { text: "To ensure that your profile fits into a message, this is limited to 50 characters." },
		fields: [{
			name: "Examples:",
			value: "`John Doe`, `Nevin A. Foster`, `Alex M.`, `Michelle Tu`, `Brandon Howard`, `Ben Simon-Thomas`"
		}]
	}, async (msg) => {
		if (msg.content.length >= 51)
			return "Sorry, but to make sure we can fit all of your information onto your profile, we capped Full Names to 50 characters. Try abbreviations or omitting parts of your name (like middle).";
		if (msg.content.length <= 3) return "Your answer is too short to be a Full name (min is 4 characters).";

		const mem = await Fetch.Member(msg.author.id);

		// If user is an Admin, the bot won't be able to set username.
		if (mem.roles.cache.has("848806375668842511")) return null;
		// If user already has a matching username.
		if (mem.displayName == msg.content)
		{
			mem.nickname = mem.displayName;
			return null;
		}
		const desc = (!mem.nickname) ?
			`You currently do not have a nickname for The Verse server. Doing this will change your display name for your profile inside the server.` :
			`You already have a nickname in the server: \`${mem.nickname}\`, would you like to update this username?`;
		// Answer is good, but do follow-up before returning answer.
		const conf = await SendConfirmation(msg.channel, { embeds:[{
			title: "Set your Server Name to your Full Name?",
			description: desc,
		}]});

		if (conf)
			await mem.setNickname(msg.content);
		else
		{
			const warn: MessageEmbedOptions = (mem.nickname) ?
				{
					author: Authors.Warning,
					description: "You choose to NOT update your server nickname. Make sure that your current username (`" + mem.nickname + "`) is **appropriate and identifiable** or your application will not be accepted!"
				} : 
				{
					author: Authors.Warning,
					description: "You choose to NOT set your server nickname. You current discord username (`" + mem.user.username + "`) **MUST be appropriate and identifiable** or your application will not be accepted!\nTo change it manually by either \n> 1) clicking on your own profile (username) inside the server,\nor\n> 2) clicking the server banner (top left, above all channels) and selecting “Edit server profile”.",
					image: { url: "https://raw.githubusercontent.com/Versebuilding/.github/main/Resources/Set-server-profile-helper-image.jpg" }
				};
			await SendAcceptNote(msg.channel, { embeds:[warn] });
		}

		return null;
	}],

	[ ProfileColumnHeaders.Pronouns, {
		title: "👩‍👦",
		description: "Your pronouns are always displayed with your profile, and everyone need it. As an online community, it is important that we know how to make everyone comfortable without forcing extra work to share their identity.\n*If you feel like the list below is incomplete or does not include you, please let us know and we will immediate add whatever is needed*",
		fields: [{
			name: "Options:",
			value: PersonalPronouns.map(p => "`" + p + "`").join(", ")
		}]
	}, (msg) => PersonalPronouns.find(p => p === msg.content) ? null : "Your answer match one of the above exactly"],

	[ ProfileColumnHeaders.Email, {
		title: "📧",
		description: "The email that you provide will be used to set up project accounts for Verse tools. We will also display this email on your profile page.",
	}, (msg) => msg.content.match(COMMON_REGEXPS.ONLY_EMAIL) ? null : "Your answer does not look like an email"],

	[ ProfileColumnHeaders["Phone Number"], {
		title: "☎️",
		description: "This is an optional field. This is generally used as an extra bit of contact info if you want it displayed with your profile.",
		fields: [{
			name: "Examples:",
			value: "`N/A`, `123-456-7890`, `(123) 456-7890`, `123 456 7890`, `123.456.7890`, `+91 (123) 456-7890`, `1234567890`"
		}]
	}, (msg) => (msg.content == "N/A" || msg.content.match(COMMON_REGEXPS.ONLY_PHONE)) ? null : "Your answer does not look like an phone number"],

	[ ProfileColumnHeaders.Color, {
		title: "🎨",
		description: "Each profile gets a nice color tint. In discord, this is the color you see on the left side of your profile. Pick anything that feels right to you!\n*See the official list of [discord color names](https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812), or use [googles color picker](https://g.co/kgs/2abmdA)*",
		fields: [{
			name: "Examples:",
			value: "**Name:** `DEFAULT`, `RED`, `NAVY`, `DARK_GOLD`, `AQUA`, `RANDOM`\n"
				+  "**RGB :** `rgb(0, 0, 0)`, `231, 76, 60`, `(52, 73, 94)`, `rgb(26,188,156)`\n"
				+  "**Hex :** `#000000`, `0xE74C3C`, `34495e`, `0Xc27C0e`, `1ABC9C`\n"
				+  "**Int :** `0`, `15158332`, `3426654`, `12745742`, `1752220`"
		}]
	}, (msg) => ToColor(msg.content) ? null : "Your answer does not look like a color! Make sure you entered something that looks like the examples, or check the [discord color names](https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812) for color names."],

	[ ProfileColumnHeaders.Timezone, {
		title: "🌄",
		description: "We work with people from around the world, and knowing timezones can make setting up meetings so much easier. *Note: Most times that The Verse uses are in PDT.*\nList of [accepted abbreviations here](https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations)\n\n*We currently are not checking these values for validity, so make sure you enter yours correctly.*",
		fields: [{
			name: "Examples:",
			value: "`PDT`, `MST`, `CEST`, `WEST`, `GMT`, `AWST`, `CST`, `OMST`"
		}],
	}, (msg) => msg.content.length < 6 ? (msg.content.length > 1 ? null : "Your answer is too short to be a timezone") : "Your answer is too long to be a timezone"],

	[ ProfileColumnHeaders.Location, {
		title: "🗺️",
		description: "No need to give an address, but let others know the area you live in.",
		fields: [{
			name: "Examples:",
			value: "`Goodyear, Arizona`, `Waterloo - Canada`, `Russia/Portugal`, `Pasadena, TX`, `Queens, NY`, `Evanston Illinois`"
		}]
	}],

	[ ProfileColumnHeaders.Bio, {
		title: "👔",
		description: "Keep it short, but give a little overview of who you are. What are your most impressive skills and accomplishments? How does the work at the Verse Inspire you? What are your favorite things? Be creative and remember that this will go on your company profile.\n\n*This is limited to 2500 characters, keep it short and sweet.*",
	}, (msg) => msg.content.length < 2501 ? (msg.content.length > 15 ? null : "Your answer is too short to be a bio (min is 16 characters)") : "Sorry but to make sure we can fit all of your information onto your profile, we capped bios to 2500 characters. Try condensing some of your information"
	],

	[ ProfileColumnHeaders["GitHub Username"], {
		title: "<:github:979281491903266826>",
		description: "We use GitHub for almost all of our content/file sharing. If you don't have an account already, you'll want to make one [here](https://github.com/join) such that we can invite you to our organization.\n\n*We do not automatically verify yet so make sure you get it right!*",
	}, (msg) => msg.content.length < 51 ? (msg.content.length > 2 ? null : "Your answer is too short to be a username") : "Your answer is too long to be a username. If your username is longer than 50 characters, send your username directly in the server and we will manually upload for you"
	],
]

personalInfo.forEach(([key, embed, filter]) =>
	ClientHelper.reg_btn(
		"PersonalInformationSetterButtons:" + ProfileColumnHeaders[key],
		CreateAskAndPost(key, embed, filter)
));

export const isProfileSetup = async (uid: string) => {
	var data = await ProfilesMod.GetAllUserDataByID(uid);
	if (!data) return false;

	var done = true;
	personalInfo.forEach(([key, embed, filter]) =>
		done = done && data[key] != undefined && data[key] != "");
	return done;
}

const ps_backToMain = CommandMenus.profileSetup.RegSwap(HelpMenus.InfoMenu);

CommandMenus.profileSetup.exitMessage = async (i) =>
	(await isProfileSetup(i.user.id)) ?
	null :
	"You have not finished setting up your profile! Are you sure you want to exit? "


const profileSetupSave = ClientHelper.reg_btn("ProfileSetup|Save", async i =>
{
	await CloseMessage(i);
});

CommandMenus.profileSetup.menu = async (btn: ButtonInteraction) =>
{
	const base: MessageOptions = {
		embeds: [{
			title: "Personal Information Preview",
			description: "Fill out the information by selecting the buttons, each with its own description and examples. Once you have entered information for a button, it will turn grey. When all buttons are completed, this section will be complete.",
			color: "BLURPLE",
			footer: { iconURL: IconLinks.Info, text: "You can always access this in the server by typing /edit-profile" },
		}]
	};

	var msg = base;
	var getting = await ProfilesMod.GetAllUserDataByID(btn.user.id);

	// Try to create entry if one was not found.
	if (!getting)
	{
		await SheetsHelpers.AppendRow({
			values: [btn.user.id],
			sheetname: "Profiles"
		});

		getting = await ProfilesMod.GetAllUserDataByID(btn.user.id);
		if (!getting) throw new Error("Data for user could not be found and failed to create.");
	}

	const data: string[] = getting;
	var done = true;

	const setButtons: MessageButton[] = personalInfo.map(([key, embed, filter]) => {
		const thisDone = data[key] != undefined && data[key] != "";
		done = done && thisDone;
		return Buttons.Empty("PersonalInformationSetterButtons:" + ProfileColumnHeaders[key])
			.setLabel(ProfileColumnHeaders[key])
			.setEmoji((embed.title ?? "N/A ⛔").split(" ").slice(-1)[0])
			.setStyle(thisDone ? "SECONDARY" : "PRIMARY");
	});

	msg.components = Buttons.ButtonsToRows(
		Buttons.Back(ps_backToMain)
			.setStyle(done ? "SUCCESS" : "DANGER")
			.setLabel(done ? "Info Menu" : "Exit to Info Menu Before Complete"),
		Buttons.Empty(profileSetupSave)
			.setStyle("SUCCESS")
			.setLabel("Close")
			.setEmoji("☑️")
			.setDisabled(!done),
	);

	msg.components.push(...Buttons.ButtonsToRows(
		...setButtons,
		Buttons.Link({
			url: "https://discord.com/channels/848804519847526460/848810485397979186",
			label: "Go to Role Assign",
		})
	));

	if (btn)
	{
		base.embeds?.push(await ProfilesMod.LoadEmbed_Personal(btn.user.id));
	}

	return msg;
};