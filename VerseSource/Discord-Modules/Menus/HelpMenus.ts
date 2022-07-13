import { Buttons, Authors } from "../../util-lib";
import { CommandMenus, HelpMenus } from "./MenuDeclarations";

HelpMenus.OutwardContent.menu = {
	embeds: [{
		author: Authors.Help,
		title: HelpMenus.OutwardContent.Title(),
		color: "BLUE",
		description: "Welcome to The Verse! Here is a great place to familiarize yourself with our goals and projects by viewing some of our outward facing content. We have an many projects that we work really hard and would love for you to check out! Here are a few links that we think show the best of the best:",
		fields: [ {
			name: "<:verse_oil:992198641991303249> Versebuilding Landing Page",
			value: "If you haven't already, our [Landing Page](https://versebuilding.com/) is a must! This is the first page that community members and investors see when learning about The Verse. This webpage shows our mission, team, projects and so much more!",
			inline: true
		}, {
			name: "<:discord:985025868449607741> The Verse: Discord",
			value: "You are already apart of [our discord](https://discord.com/channels/848804519847526460/979244080494182430), but make sure you check out our <#979244080494182430> channel. This is a great place to learn about our most recent milestones and even game out a bit!",
			inline: true
		}],
		footer: { text: "We are currently working on adding more pages here!" }
	}],
	components: Buttons.ButtonsToRows(
		Buttons.Back(HelpMenus.OutwardContent.RegSwap(HelpMenus.InfoMenu))
			.setLabel("Back to Info"),
		Buttons.Link({
			url: "https://versebuilding.com",
			label: "Versebuilding.com",
			emoji: "<:verse_oil:992198641991303249>"
		}),
		Buttons.Link({
			url: "https://discord.com/channels/848804519847526460/979244080494182430",
			label: "Announcements Channel",
			emoji: "<:discord:985025868449607741>"
		}),
		Buttons.Next(Buttons.NullCall).setDisabled(true),
	)
};

/********************************************************/
/*                     Server Rules                     */
/********************************************************/
HelpMenus.ServerRules.menu = {
	embeds: [{
		author: Authors.Help,
		title: HelpMenus.ServerRules.Title(),
		description: "We at The Verse have some rules in place to ensure a safe environment for everyone here.",
		thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/760/760205.png" },
		fields: [{
			name: "🔞 NSFW Content",
			value: "Any form of NSFW content is strictly forbidden, if you are found posting content of this nature, you will be banned on the spot.",
			inline: false,
		}, {
			name: "☮️ Defamation and Derogatory Behavior",
			value: "Absolutely no Racist, Sexist, or otherwise degrading behavior will be tolerated. Anyone displaying this behavior will be banned.",
			inline: false,
		}, {
			name: "📳 Spam",
			value: "Small spam is okay, but don't go crazy and massively spam the chats.",
			inline: false,
		}, {
			name: "💟 Respect",
			value: "Everyone deserves an equal amount of respect, so make sure to respect everyone.",
			inline: false,
		}, {
			name: "⛔ Mentions and Direct Messaging",
			value: "Do not ping or DM the Developers or Admin without good reason or explicit permissions.",
			inline: false,
		}]
	}],
	components: Buttons.ToRows(
		Buttons.Back(HelpMenus.ServerRules.RegSwap(HelpMenus.InfoMenu))
			.setLabel("Back to Info"),
	)
};

/********************************************************/
/*                   Getting Started                    */
/********************************************************/
HelpMenus.GettingStarted.menu = {
	embeds: [{
		author: Authors.Help,
		title: "Getting Started? 🆕",
		description: "Thank you for joining The Verse Discord server! Check out the following channels to get started.",
		thumbnail: { url: "https://theme.zdassets.com/theme_assets/1332047/4acd41293a735190ff0f1c41be28d2f5ad5a91bf.png" },
		fields: [{
			name: "📔 Want to learn More?",
			value: "<#848805001643556874> Learn about how to use our Discord server",
			inline: false,
		}, {
			name: "⚙️ Got skills?",
			value: "<#848810485397979186> Select your projects and skills.",
			inline: false,
		}, {
			name: "🤝 Interested in the community?",
			value: "<#848805950282268692> Introduce yourself to The Verse.",
			inline: false,
		}, {
			name: "📰 Looking for some fun content?",
			value: "<#979244080494182430> Check out the latest developments.",
			inline: false,
		}]
	}],
	components: Buttons.ToRows(
		Buttons.Back(HelpMenus.GettingStarted.RegSwap(HelpMenus.InfoMenu))
			.setLabel("Back to Info"),
	)
};

/********************************************************/
/*                  Main Landing Page                   */
/********************************************************/
HelpMenus.InfoMenu.MakeDirectoryMenu({ embeds: [{
	author: Authors.Help,
	color: "AQUA",
	title: "Info Menu",
	description: "The Verse has a lot of moving parts",
	footer: { text: HelpMenus.InfoMenu.desc }
}]}, [
	HelpMenus.GettingStarted,
	HelpMenus.ServerRules,
	HelpMenus.OutwardContent,
	HelpMenus.VerseCreatorApplication,
	CommandMenus.profileSetup,
]);