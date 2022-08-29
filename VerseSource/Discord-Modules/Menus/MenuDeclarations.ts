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
		{ name: "Outward Content", desc: "Webpages, Games, Art, and more!", emoji: "🌎" }
	);

	export const GettingStarted = new MessageMenu(
		{ name: "Getting Started?", desc: "Find some great channels for new members.", emoji: "🆕" }
	);

	export const ServerRules = new MessageMenu(
		{ name: "Open Server Rules", desc: "Rules for being a member in The Verse.", emoji: "📔" }
	);

	export const InternalContent = new MessageMenu(
		{ name: "Internal Content!", desc: "Links and info on internal tools and projects.", emoji: "🔐", regFlags: "DMOPEN" }
	)
	
	export const VerseCreatorApplication = new MessageMenu(
		{ name: "Verse Application!", desc: "Main page for completing the initial Verse application.", emoji: "👨‍💼", regFlags: "DMOPEN" }
	);

	export const OnboardingHome = new MessageMenu(
		{ name: "Creator Onboarding!", desc: "First tasks after entering The Verse.", emoji: "✍️", regFlags: "DMOPEN" }
	)
}

export namespace CommandMenus
{
	export const profileSetup = new MessageMenu(
		{ name: "Set Personal Information", desc: "Fill out basic info for your public company profile.", emoji: "<:name_tag:986290647189291008>", regFlags: "DMOPEN" }
	);

	export const StandUp = new MessageMenu(
		{ name: "Create Standup", desc: "Create an update card for a project.", emoji: "<:name_tag:986290647189291008>", regFlags: "DMOPEN" }
	);

	export const eventCreator = new MessageMenu(
		{ name: "Create Event", desc: "Create an event for the Google Calendar.", emoji: "📅", regFlags: "DMOPEN" }
	);
}