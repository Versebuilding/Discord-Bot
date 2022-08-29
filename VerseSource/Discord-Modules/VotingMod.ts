import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction } from "discord.js";
import { Authors, Buttons, ClientHelper, Fetch, Filters, GetNumberEmoji } from "../util-lib";
import * as crypto from "crypto";
import { Debug } from "../Logging";


const pollButtonName =
	ClientHelper.reg_btn("RegisterVoteForPollButton", PollButton, undefined, true);

ClientHelper.reg_cmd(
	new SlashCommandBuilder()
		.setName("create-poll")
		.setDescription("Create a message that lets members vote on options")
		.addStringOption(options => options
			.setName("description")
			.setDescription("Description that will be included with the poll")
			.setRequired(true))
		.addBooleanOption(options => options
			.setName("anonymous")
			.setDescription("If the poll should be anonymous (default false)")
			.setRequired(false))
		.addNumberOption(options => options
			.setName("max-votes")
			.setDescription("Number of options each member can select (default 1)")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-1")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-2")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-3")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-4")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-5")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-6")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-7")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-8")
			.setDescription("A votable option for the message")
			.setRequired(false))
		.addStringOption(options => options
			.setName("option-9")
			.setDescription("A votable option for the message")
			.setRequired(false)),
	OnCMD_Poll,
);

async function OnCMD_Poll(cmd: CommandInteraction)
{
	const max_votes = cmd.options.getNumber("max-votes") ?? 1;
	const desc = cmd.options.getString("description") ?? "";
	const anon = cmd.options.getBoolean("anonymous") ?? false;
	var options: string[] = [];

	for (var i = 1; i < 10; i++)
	{
		const opt = cmd.options.getString("option-" + i.toString());
		if (opt) options.push(opt);
	}

	if (options.length < 2)
	{
		await cmd.reply({ embeds: [{ author: Authors.Error, description: "You must have at least two options to start a poll!" }], ephemeral: true });
		return;
	}

	if (max_votes <= 0)
	{
		await cmd.reply({ embeds: [{ author: Authors.Error, description: `Max votes (${max_votes}) must be a positive number` }], ephemeral: true });
		return;
	}

	if (max_votes >= options.length)
	{
		await cmd.reply({ embeds: [{
			author: Authors.Error,
			description: `Max votes (${max_votes}) must be less than the number of options (${options.length}).`
		}], ephemeral: true });
		return;
	}

	var indices = options.flatMap((opt, index) => (opt.length >= 254 || opt.length < 1) ? [index] : []);
	if (indices.length > 0)
	{
		await cmd.reply({ embeds: [{
			author: Authors.Error,
			description: "Voting options must be less than 254 characters. Invalid options: [ " + indices.join(", ") + " ]"
		}], ephemeral: true });
		return;
	}

	const mem = await Fetch.Member(cmd.user.id);

	await cmd.reply({ embeds: [{
		author: { iconURL: mem.displayAvatarURL(), name: mem.displayName },
		color: "YELLOW",
		title: anon ? "Anonymous Poll" : "Public Poll",
		description: desc,
		fields: options.map((opt, index) => ({
			name: GetNumberEmoji(index) + " " + opt,
			value: "Vote Count: `0`",
			inline: opt.length < 100,
		})),
		footer: { text: "Select a max of " + max_votes + ` (${anon ? "" : "NOT " }anonymous)` },
	}], ephemeral: false, components: Buttons.ButtonsToLimitedRows(
			options.map((_, index) => Buttons.Empty(pollButtonName + index)
				.setLabel("Vote/Unvote")
				.setEmoji(GetNumberEmoji(index))
				.setStyle("SECONDARY")),
			3
	)});

}

async function PollButton(btn: ButtonInteraction)
{
	if (!btn.isButton())
	{
		console.error("Not a button!");
		return;
	}

	const index = parseInt(btn.customId.substring(pollButtonName.length));
	const msg = await Fetch.ButtonMessage(btn);

	if (!msg.embeds || msg.embeds.length != 1 || msg.embeds[0].fields.length < 2 || !msg.components)
	{
		await btn.reply({ embeds: [{
			author: Authors.Error,
			description: "Poll message has a bad format! We could not register a vote." }],
			ephemeral: true
		});
		Debug.LogError(new Error("Poll message has a bad format! We could not register a vote."));
		return;
	}

	const max = parseInt(msg.embeds[0].footer.text.substring("Select a max of ".length));
	const anon = msg.embeds[0].footer.text.endsWith("(anonymous)");
	const name: (count: number) => string = (anon) ?
		count => "`" + crypto.createHash("SHA256").update(btn.user.id + msg.id + count)
					.digest("base64").substring(0, 12).replace('\n', "$") + "`" :
		count => `<@${btn.user.id}>`;

	const content = {
		embeds: [msg.embeds[0]],
		components: msg.components
	};

	if (index > msg.embeds[0].fields.length)
	{
		await btn.reply({ embeds: [{
			author: Authors.Error,
			description: "It seems like your voting option is out of range (option " + index + ")." }],
			ephemeral: true
		});
		return;
	}

	var voted: number[] = [];

	msg.embeds[0].fields.forEach((field, field_index) => {
		if (field.value.split("\n")
			.find((n, name_index) =>
				n == name(field_index))
		) {
			voted.push(field_index);
		}
	});

	const voting = !voted.includes(index);
	if (voted.length >= max && voting)
	{
		await btn.reply({ embeds: [{
			author: Authors.Warning,
			description: "You cannot vote more than " + max + " time(s) on this poll. Please un-vote an answer first."
		}], ephemeral: true
		});
		return;
	}

	const def_promise = btn.deferUpdate();

	const indexof = content.embeds[0].fields[index].value.indexOf("\n");
	const val = indexof != -1 ?
		content.embeds[0].fields[index].value.substring(indexof) :
		"";

	var replace: string;
	if (!voting)
	{
		replace = val.split("\n").filter((n) =>
			n != name((index))
		).join("\n");

		Debug.Log(`${btn.user.username} un-voted for '${content.embeds[0].fields[index].name}'`);
	}
	else
	{
		replace = val + "\n" + name(index);
		Debug.Log(`${btn.user.username} voted for '${content.embeds[0].fields[index].name}'`);
	}

	replace = "Vote Count: `" + (replace.split("\n").length - 1) + "`" + replace;
	content.embeds[0].fields[index].value = replace;

	await msg.edit(content).catch(Debug.LogError);
	await def_promise;
}

// /create-poll description:This is a test poll! max-votes:2 option-1:Example for the first option-2:This is number 2 option-3:The third option-4:The list continues... option-5:Five is cool option-6:Six is for sticks option-7:Seven for Nevin option-8:Eight for create option-9:Nine for Pine