import { MessageMenu } from "./MessageMenu";

export namespace HelpMenus
{
	/** The main page for all Verse Information. */
	export const InfoMenu = new MessageMenu({
		name: "Open Info Menu!",
		desc: "The main page for all Verse Information",
		emoji: "📝",
		regFlags: "DMOPEN",
	});

	/** Page 1 for learning about the verse */
	export const OutwardContent = new MessageMenu(
		{ name: "Outward Content", desc: "Webpages, Games, Art, and more!", emoji: "🌎" },
	);

	export const GettingStarted = new MessageMenu(
		{ name: "Getting Started?", desc: "Find some great channels for new members.", emoji: "🆕" }
	);

	export const ServerRules = new MessageMenu(
		{ name: "Open Server Rules", desc: "Rules for being a member in The Verse", emoji: "📔" }
	);;
	
	export const VerseCreatorApplication = new MessageMenu(
		{ name: "Verse Application!", desc: "Main page for completing the initial Verse application", emoji: "👨‍💼", regFlags: "DMOPEN" },
	);
}

export namespace CommandMenus
{
	export const profileSetup = new MessageMenu(
		{ name: "Set Personal Information", desc: "Fill out basic info for your public company profile.", emoji: "<:name_tag:986290647189291008>", regFlags: "DMOPEN" },
	);
}