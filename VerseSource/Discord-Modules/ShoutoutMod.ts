import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, InteractionReplyOptions, MessageOptions } from "discord.js";
import { Debug } from "../Logging";
import { Authors, AwaitButtonFollowup, Buttons, ClientHelper, Fetch, Filters, GetNumberEmoji, IconLinks, Roles, SendConfirmation, SheetsHelpers, VAPI } from "../util-lib";

const boards: string[] = [
	"Gratitude",
	"Music",
];

ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName("gratitude-shoutout")
	.setDescription("Post a shout out to the gratitude boards.")
	.addUserOption(opt => opt
		.setName("who")
		.setDescription("The person who is being thanked.")
		.setRequired(true))
	.addStringOption(opt => opt
		.setName("message")
		.setDescription("The message to be posted. Must be less than 250 characters.")),
	OnCMD_GratitudeShoutout
);

ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName("music-shoutout")
	.setDescription("Post a shout out to the music board.")
	.addStringOption(opt => opt
		.setName("song-search")
		.setDescription("This will be used to search for the song for the post. Less than 100 characters.")),
	OnCMD_MusicShoutout
);


ClientHelper.reg_cmd(new SlashCommandBuilder()
	.setName("create-board")
	.setDescription("Create a new board for the given shoutouts.")
	.addStringOption(opt => opt
		.setName("board")
		.setDescription("The name of the board.")
		.setRequired(true)
		.addChoices(
			...boards.map(v => ({ name: v, value: v }))
		))
	.addBooleanOption(opt => opt
		.setName("flush")
		.setDescription("Flush the google sheets after creating the board.")
		.setRequired(false)),
	OnCMD_CreateBoard,
	Filters.iModeratorAuth()
);

async function OnCMD_GratitudeShoutout(interaction: CommandInteraction)
{
	const who = interaction.options.getUser("who");
	const message = interaction.options.getString("message");

	// Validate inputs
	if (!who)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Who is being thanked must be specified."}], ephemeral: true });
	if (!message)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Message must be specified." }], ephemeral: true });
	if (message.length >= 250)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Message must be less than 250 characters."}], ephemeral: true });

	const [channel, member] = await Promise.all([
		Fetch.TextChannel(interaction.channelId),
		Fetch.Member(interaction.user.id)
	]);

	// Send shoutout message and upload to Google Sheets
	await Promise.all([
		channel.send({
			content: "<@" + who.id + ">",
			embeds: [{
				author: {
					name: member.displayName,
					iconURL: member.user.displayAvatarURL(),
				},
				title: "Gratitude Shoutout",
				description: `<@${who.id}>: ${message}`,
				color: 0x00ff00,
			}]
		}),
	
		SheetsHelpers.AppendRow({
			values: [
				member.user.id,
				who.id,
				message
			],
			sheetname: "Gratitude"
		}),
	]);

	// Send confirmation message
	return await interaction.reply({ embeds: [{ author: Authors.Shoutout, description: "Shoutout sent and registered for weekly board!"}], ephemeral: true });
}

async function OnCMD_MusicShoutout(interaction: CommandInteraction)
{
	const songSearch = interaction.options.getString("song-search");

	// Validate inputs
	if (!songSearch)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Song search must be specified."}], ephemeral: true });
	if (songSearch.length > 100 || songSearch.length < 3)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Song search must be between 3 and 100 characters."}], ephemeral: true });

	const [channel, member, results, _] = await Promise.all([
		Fetch.TextChannel(interaction.channelId),
		Fetch.Member(interaction.user.id),
		VAPI.Deezer.Search(songSearch),
		interaction.deferReply({ ephemeral: true }),
	]);

	if (!results)
	{
		interaction.followUp
		await interaction.followUp({
			embeds: [{
				author: Authors.Error,
				description: "Spotify API did not respond!"
			}], ephemeral: true
		});
		return;
	}

	Debug.Log(results);
	
	if (!results?.data)
	{
		await interaction.followUp({
			embeds: [{
				author: Authors.Error,
				description: "Spotify API did not respond with a valid body!"
			}], ephemeral: true
		});
		return;
	}

	if (results.data.length === 0)
	{
		await interaction.followUp({
			embeds: [{
				author: Authors.Error,
				description: "No results found!"
			}], ephemeral: true
		});
		return;
	}
	
	const displaceCount = Math.min(8, results.data.length);
	const btn = await AwaitButtonFollowup(interaction, {
		embeds: [{
			author: Authors.Shoutout,
			description: "Please select the correct song to shoutout. You have 5 minutes to select a song.",
			color: "BLURPLE",
		},
			...results.data.slice(0, displaceCount).map((track, index) =>
			{
				const embed = VAPI.Deezer.CreateTrackEmbed(track);
				embed.title = GetNumberEmoji(index) + " " + embed.title;
				return embed;
			})
		],
		components: Buttons.NiceButtonsToRows(
			...results.data.slice(0, displaceCount).map((track, index) =>
				Buttons.Empty(index.toString())
					.setEmoji(GetNumberEmoji(index))
					.setLabel(track.title_short)
					.setStyle("PRIMARY")
			),
			Buttons.Empty("cancel")
				.setLabel("Cancel")
				.setStyle("DANGER")
		)
	});


	if (btn.customId === "cancel")
	{
		await btn.deferUpdate();
		return;
	}

	const track = results.data[parseInt(btn.customId)];

	// Send shoutout message and upload to Google Sheets
	const trackEmbed = VAPI.Deezer.CreateTrackEmbed(track);
	trackEmbed.footer = { text: "Music Shout-out by " + member.displayName };
	await Promise.all([
		channel.send({ embeds: [trackEmbed] }),

		btn.deferUpdate(),
	
		SheetsHelpers.AppendRow({
			values: [
				member.user.id,
				track.title,
				track.artist.name,
				track.album.title,
				track.link,
			],
			sheetname: "Music"
		}),
	]);

	return;
}

async function OnCMD_CreateBoard(interaction: CommandInteraction)
{
	const board = interaction.options.getString("board");
	const flush = interaction.options.getBoolean("flush");

	if (!board)
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Board name must be specified." }], ephemeral: true });
	
	if (!boards.find(b => b === board))
		return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Board name must be one of the following: " + boards.join(", ") }], ephemeral: true });
	
	const [sheets, _, channel] = await Promise.all([
		SheetsHelpers.ReadAll(board),
		interaction.deferReply({ ephemeral: true }),
		Fetch.TextChannel(interaction.channelId),
	]);

	const sheetValues = sheets?.values?.slice(1)

	if (!sheetValues)
	{
		await interaction.followUp({
			embeds: [{
				author: Authors.Error,
				description: "There was an error reading the board data from Google Sheets!"
			}], ephemeral: true
		});
		return;
	}

	if (sheetValues.length === 0)
	{
		await interaction.followUp({
			embeds: [{
				author: Authors.Error,
				description: "There are no entries for this board!"
			}], ephemeral: true
		});
		return;
	}

	const boardMessage: MessageOptions = {
		content: "@everyone",
	};

	if (board == "Gratitude")
	{
		boardMessage.embeds = [{
			author: Authors.Shoutout,
			title: "Gratitude Board",
			color: "GREEN",
			thumbnail: { url: IconLinks.Gratitude },
			description: "Check out the newest Verse recognitions below!\n" +
				sheetValues.map((row, index) => 
					`**From** <@${row[0]}>\n` +
					`**To** <@${row[1]}>**:** ${row[2]}`
				).join("\n")
		}];
	}
	else if (board == "Music")
	{
		boardMessage.embeds = [{
			author: Authors.Shoutout,
			thumbnail: { url: IconLinks.MusicCloud },
			title: "Music Board",
			color: "BLUE",
			description: "Check out the newest music likes/recommendations!\n" +
			sheetValues.map((row, index) => 
				`**[${row[1]}](${row[4]})** - <@${row[0]}>\n` +
				`*${row[2]}* on album *${row[3]}*.`
			).join("\n")
		}];
	}
	else
	{
		throw new Error("Unknown board type!");
	}

	if (flush)
		await SheetsHelpers.Clear(board);
	
	await channel.send(boardMessage)
	
	await interaction.followUp({
		embeds: [{
			author: Authors.Success, description: "Board sent!", color: "GREEN"
		}],
		ephemeral: true
	});
}
