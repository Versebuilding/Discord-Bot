import { CommandInteraction, EmojiResolvable, Message, MessageOptions } from "discord.js";
import { Authors, BaseInteraction, Delegate, Fetch, Filters, MessageData } from "../../util-lib";
import { CommandMenus } from "./MenuDeclarations";

const eventDetails: [name: string, emoji: EmojiResolvable, valid: Delegate<[Message], string | null>][] =
[
	["title", "📝", (msg) => msg.content.length > 100 ?
		"The title of an event is limited to 100 characters at max." :
		msg.content.length < 4 ? "The title of an event is limited to 4 characters at minimum." : null],
	["description", "📝", (msg) => msg.content.length > 2000 ?
		"The description of an event is limited to 2000 characters at max." :
		msg.content.length < 4 ? "The description of an event is limited to 4 characters at minimum." : null],
	[]
]

CommandMenus.eventCreator.allowed = Filters.iModeratorAuth();

CommandMenus.eventCreator.menu = async (i: BaseInteraction): Promise<MessageData> =>
{
	const emptyMessage: MessageOptions = {
		embeds: [{
			author: Authors.Calendar,
			title: "Event Creator",
			description: "Please enter the event details using the buttons below (purple is required).",
			color: 0x00ff00,
		}]
	};

	if (i.isButton())
	{
		const message = await Fetch.ButtonMessage(i);

		message.embeds[0].fields;
	}
	

	return emptyMessage;
}