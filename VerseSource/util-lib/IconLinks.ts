export const IconLinks =
{
	Application: "https://cutewallpaper.org/24/prepare-clipart/34529268.jpg",
	Edit: "https://freeiconshop.com/wp-content/uploads/edd/edit-flat.png",
	Info: "https://upload.wikimedia.org/wikipedia/en/thumb/3/35/Information_icon.svg/768px-Information_icon.svg.png",
	ComputerCore: "https://cdn.iconscout.com/icon/free/png-256/core-1869229-1581659.png",
	Error: "https://upload.wikimedia.org/wikipedia/commons/3/34/ErrorMessage.png",
	Warning: "https://www.safetysign.com/images/source/medium-images/J6520.png",
	Check: "https://uxwing.com/wp-content/themes/uxwing/download/48-checkmark-cross/success-green-check-mark.png",
	Vote: "https://icons.iconarchive.com/icons/iconarchive/blue-election/1024/Election-Vote-icon.png",
}

export const Authors = {
	Help: {
		name: "Help Bot!",
		iconURL: IconLinks.Info
	},

	Core: {
		name: "Verse Bot Core",
		iconURL: IconLinks.ComputerCore,
	},

	Application: {
		icon_url: IconLinks.Application,
		name: "Application"
	},

	Warning: {
		icon_url: IconLinks.Warning,
		name: "Warning!"
	},

	Error: {
		icon_url: IconLinks.Error,
		name: "Error!"
	},

	Vote: {
		name: "Vote",
		icon_url: IconLinks.Vote,
	}
}

export const Channels = 
{
	rules_and_info: "848805001643556874",
	introductions: "848805950282268692",
	applications: "985232422847258625",
	bot_setup: "849353615222898709",
	announcements: "979244080494182430",
}

export const Roles =
{
	Creator: {
		id: "973632605754912799",
		emoji: "<:verse_oil:992198641991303249>",
		description: ""
	},
	Copper: {
		id: "985398694021042227",
		emoji: "🥉",
		description: "Active member."
	},
	Silver: {
		id: "985396118923919411",
		emoji: "🥈",
		description: "Hard working member."
	},
	Gold: {
		id: "985398006482362398",
		emoji: "🥇",
		description: "Significant member and contributor."
	},
	Diamond: {
		id: "985398854692253706",
		emoji: "💎",
		description: "Top tier member."
	},
	Moderator: {
		id: "986754390213947392",
		emoji: "🛂",
		description: "Most Admin privileges including Bans, Roles, and Channels."
	},
	AiB: {
		id: "974062599341740102",
		emoji: "🫁",
		description: "Using breath to control games."
	},
	Karma: {
		id: "974062656262651955",
		emoji: "🎭",
		description: "Gamifying prosociality as a therapeutic."
	},
	Walk: {
		id: "974062705839341609",
		emoji: "🚶‍♂️",
		description: "Social therapeutic based on experiences."
	},
	Web3: {
		id: "984342143269212171",
		emoji: "🪙",
		description: "Creating a new iteration of the internet using blockchain technology."
	},
	PrePost: {
		id: "984342524565016636",
		emoji: "⌛",
		description: "Measuring the change in a player's emotional baseline."
	},
	U4EA: {
		id: "984342387776192522",
		emoji: "<:u4ea_logo:985090358536974407>",
		description: "Gamifying Social/Emotional Education using sound, colors, and shapes."
	},
	Narrative: {
		id: "978163350481555476",
		emoji: "📚",
		description: "Stories, Lore, Dialog, and plot."
	},
	Research: {
		id: "978163622889029663",
		emoji: "🔬",
		description: "Research, Scientific Review, Data Collection."
	},
	PM: {
		id: "984350109431136266",
		emoji: "📋",
		description: "Task tracking, Organization, Project plans, Blockade removal."
	},
	Video: {
		id: "978178844429262918",
		emoji: "🎦",
		description: "Filming, Outlining, Processing, Effects."
	},
	Audio: {
		id: "978163368416391269",
		emoji: "🎙️",
		description: "Audio Editing, Sound Collection."
	},
	Marketing: {
		id: "984352902070038558",
		emoji: "💹",
		description: "Pitch decks, Funding, Outward content."
	},
	Art2D: {
		id: "978162752747110465",
		emoji: "🎨",
		description: "UI, Composition, Page design, Logos."
	},
	Art3D: {
		id: "978162822980710400",
		emoji: "🧊",
		description: "Modeling, Sculpting, Texturing, Rendering."
	},
	AI: {
		id: "978163649891942431",
		emoji: "🧠",
		description: "Policies, Genetic algorithms, RL, NN."
	},
	Web: {
		id: "978162584555507732",
		emoji: "<:wevdevlogo:978186921719238666>",
		description: "HTML, CSS, JS, JQuery, Bootstrap, React JS."
	},
	Backend: {
		id: "978163935167537182",
		emoji: "🎚️",
		description: "SQL, PHP, Node JS, DNS, Cloud, Data."
	},
	Unity: {
		id: "978162675022434364",
		emoji: "<:unitylogo:978185618465120276>",
		description: "Unity Engine, C#, Gameobjects, Monobehaviors."
	},
	Unreal: {
		id: "978162712804732928",
		emoji: "<:unreallogo:978185940793180200>",
		description: "Unreal Engine, BP/C++, Actors, Materials."
	},
};

export function GetRoleInfo(id: string): 
	[string, {
		id: string,
		emoji: string,
		description: string,
	}]
{
	return Object.entries(Roles).find(([r, k]) =>
		(k.id ? k.id == id : false));
};