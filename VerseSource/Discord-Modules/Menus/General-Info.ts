
/********************************************************/
/*              Learn About The Verse (1)               */
/********************************************************/
learn_1 = [{
	title: "Learn: Outward Content (1.1)",
	color: 4321431,
	description: "Welcome to The Verse! While you are waiting for interviews and/or internal access, you should familiarize yourself with our goals and projects by viewing some of our outward facing content. Once you have been added, we have an extensive list for each project available. Here are a few links that we think show the best of the best:",
	fields: [
	{
		"name": "Versebuilding Landing Page",
		"value": "If you haven't already, our [Landing Page](https://versebuilding.com/) is a must! This is the first page that community members and investors see when learning about The Verse. This webpage shows our mission, team, projects and so much more!",
		"inline": true
	},
	{
		"name": "The Verse: Discord",
		"value": "You are already appart of [our discord](https://discord.com/channels/848804519847526460/979244080494182430), but make sure you check out our [Announcements page](https://discord.com/channels/848804519847526460/979244080494182430). This is a great place to learn about our most recent milestones and even game out a bit!",
		"inline": true
	}
	]
}, [{
	style: 4,
	label: "Back",
	customId: map.MakeBtnId(PreChangeToMain),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Next",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(learn_2)),
	disabled: false,
	emoji: "➡️",
	type: 2
}]
];

/********************************************************/
/*                Discord Introduction                  */
/********************************************************/
learn_2 = [{
	title: "Learn: Discord Intro (1.2)",
	color: 4321431,
	description: "**Discord can be confusing and overwhelming** if you are new or not familiar with similar platforms. Discord is used for all of our communication, including direct and group messaging and voice/video calling. We have listed out some terminology to help with completing onboarding, and you can always [learn more here](https://support.discord.com/hc/en-us/articles/360045138571-Beginner-s-Guide-to-Discord), or by searching online yourself.",
	fields: [
	{
		"name": "Servers and Direct messaging",
		"value": "Servers are listed on the right of discord, and represent a group or organization. Our server is called “The Verse”. Direct messaging automatically happens outside of the server and is located at the top left above all of your servers.",
		"inline": false
	},
	{
		"name": "Categories and Channels",
		"value": "Categories are only used for grouping channels. The Verse has a few categories, including “Information” and “General”. Channels are groups chats used to divide different conversations, mainly used for separating project conversations, announcements, and other. There are both Voice and Text channels.",
		"inline": false
	},
	{
		"name": "Roles and User Information",
		"value": "As a Discord user, you can set your own profile information to identify yourself better. In addition to your default profile, you also have a “member” profile for each server that you are added to. You can view yours and others profile by clicking on a username/icon. While you are viewing the information within our server, you can see all of the roles that person has. These roles are used in “@” messages in order to notify everyone under a specific group. Roles are also useful for keeping track of who is in what projects or has specific skills.",
		"inline": false
	}
	]
}, [{
	style: 2,
	label: "Back",
	customId: map.MakeBtnId(PreChangeMenuFromContext.bind(learn_1)),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Done!",
	customId: map.MakeBtnId(
		Conf.bind("Are you sure you understand all of the information listed in this section?"),
		PreChangeToMain.bind({ name: main[1][0].label, value: "`I understand the information`", completed: true })),
	disabled: false,
	emoji: "➡️",
	type: 2
}]
];