/********************************************************/
/*                Set Server Roles (3)                  */
/********************************************************/
nickname = [{
	title: "Set Server Roles (3)",
	color: 4321431,
	description: "As stated in “Discord Information”, Roles are also useful for keeping track of who is in what projects or has specific skills, an important part of collaboration and finding help. You can assign yourself to these roles by visiting the [role-assign](https://discord.com/channels/848804519847526460/848810485397979186) channel within The Verse. Clicking on the buttons will give you a private message stating the role change and the message will update that role’s count. Once you’ve added a role will be able to see your new roles by viewing your server profile. If you are not added to a project yet, you can add yourself to the projects that you are interested in, and update it later. If you are unsure about what projects you want to be apart of, feel free to just update your skills and come back to this later.",
}, [{
	style: 3,
	label: "Back",
	customId: map.MakeBtnId(PreChangeToMain),
	disabled: true,
	emoji: "⬅️",
	type: 2
}, {
	style: 3,
	label: "Done!",
	customId: map.MakeBtnId(
		async b => {
			var mem = await FetchMember(b.user.id);
			var content = "";
			if (mem.roles.cache.size < 3)
				content = "Are you sure you completed this task? You look like you don't have any of the project or skill roles. Consider rereading this task as you will not be given permissions until this is done."
			else
				content = "Looks good to us! Just confirm that these are the roles that you selected ('Community' and '@everyone' by default)."
			content += "\n**Your Roles:**" + mem.roles.cache.map(r => r.name).join("\n");

			if (await Conf.bind(content)())
				return;
			PreChangeToMain.bind({
				name: main[1][1].label,
				value: "`" +mem.roles.cache.map(r => r.name).join(", ") + "`",
				completed: true
			})();
		}),
	disabled: false,
	emoji: "☑️",
	type: 2
}]
];

/********************************************************/
/*                  Introduce Yourself                  */
/********************************************************/
{
	"embeds": [{
		"title": "Introduce Yourself",
		"color": 4321431,
		"description": "In our discord server, we have a channel named [Introductions](https://discord.com/channels/848804519847526460/848805950282268692) for you to introduce yourself and meet some of the other members. If you would like, you can either write your own message to the channel, or you can fill out the questions here and get your introduction posted in a fancy message (embed). Bonus points for the more creative your answers are!\n*You must answer all questions before you can send the message.*",
		"fields": [
			{
				"name": "1️⃣ Name/Pronouns",
				"value": "What is your name? Any nick names? What are your pronouns?",
				"inline": true
			},
			{
				"name": "2️⃣ Location",
				"value": "Where did you grow up? Where you are based now?",
				"inline": true
			},
			{
				"name": "3️⃣ Career/Academic background",
				"value": "In a sentence or two, what are your qualifications and knowledge?",
				"inline": true
			},
			{
				"name": "4️⃣ Your Favorite",
				"value": "What is your favorite thing of any topic. Examples include games, movies, car, tech...",
				"inline": true
			},
			{
				"name": "5️⃣ Personal/Work Builds",
				"value": "No need for massive details, but what projects have you worked on?",
				"inline": true
			},
			{
				"name": "6️⃣ Fun Fact",
				"value": "What would I know if I really knew you?",
				"inline": true
			},
			{
				"name": "7️⃣ Hobbies and Bonus",
				"value": "Fun stuff that might not be caught by other questions. Maybe some hobbies?",
				"inline": true
			}
		]
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "Name/Pronouns",
			"custom_id": "PreInterviewOption_intro_0",
			"disabled": false,
			"emoji": { "name": "1️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Location",
			"custom_id": "PreInterviewOption_intro_1",
			"disabled": false,
			"emoji": { "name": "2️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Career/Academic background",
			"custom_id": "PreInterviewOption_intro_2",
			"disabled": false,
			"emoji": { "name": "3️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Your Favorite",
			"custom_id": "PreInterviewOption_intro_3",
			"disabled": false,
			"emoji": { "name": "4️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Personal/Work Builds",
			"custom_id": "PreInterviewOption_intro_4",
			"disabled": false,
			"emoji": { "name": "5️⃣" },
			"type": 2
		}
	]}, {
		"type": 1,
		"components": [ {
			"style": 1,
			"label": "Fun Fact",
			"custom_id": "PreInterviewOption_intro_5",
			"disabled": false,
			"emoji": { "name": "6️⃣" },
			"type": 2
		}, {
			"style": 1,
			"label": "Hobbies and Bonus",
			"custom_id": "PreInterviewOption_intro_6",
			"disabled": false,
			"emoji": { "name": "7️⃣" },
			"type": 2
		}, {
			"style": 3,
			"label": "Send Embed Message",
			"custom_id": "PreInterviewOption_intro_send",
			"disabled": true,
			"emoji": { "name": "📨" },
			"type": 2
		}, {
			"style": 3,
			"label": "Already Sent Mesage",
			"custom_id": "PreInterviewOption_intro_pass",
			"disabled": false,
			"emoji": { "name": "📬" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_intro_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*               Get Access to Verse Tools              */
/********************************************************/
{
	"embeds": [{
		"title": "Get Access to Verse Tools",
		"color": 4321431,
		"description": "In order to add you to some of our platforms, we will need your usernames, account ids, or sometimes just a preferred email. You may need to create an account for some of these platforms if you do not have one already.",
		"fields": [
			{
				"name": "📧 Preferred Email",
				"value": " This will be used for all platforms that only require an email for an account/access, including the Google Suite, Clickup and Miro. All of the platforms will be discussed further once we can add you to projects.",
				"inline": false
			},
			{
				"name": "<:github:979281491903266826> GitHub Username",
				"value": "We use GitHub for much of our file sharing, usually only recording to Google Drive for larger files like videos. If you are new to GitHub or didn’t know, you can set your display name (different from the username). We would recommend changing your display name to something professional as your Github is a great place to showoff your work in the future!",
				"inline": false
			}
		]
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "Set Email",
			"custom_id": "PreInterviewOption_tools_0",
			"disabled": false,
			"emoji": { "name": "📧" },
			"type": 2
		}, {
			"style": 1,
			"label": "Set GitHub Username",
			"custom_id": "PreInterviewOption_tools_1",
			"disabled": false,
			"emoji": { "id": "979281491903266826", "name": "github" },
			"type": 2
		}, {
			"style": 3,
			"label": "Add to Application",
			"custom_id": "PreInterviewOption_tools_submit",
			"disabled": true,
			"emoji": { "name": "📥" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_tools_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*                  Interview Questions                 */
/********************************************************/
{
	"embeds": [{
		"title": "Interview Questions",
		"color": 4321431,
		"description": "This is a WIP, for now, just submit as completed."
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 3,
			"label": "Completed",
			"custom_id": "PreInterviewOption_cont",
			"disabled": false,
			"emoji": { "name": "☑️" },
			"type": 2
		}, {
			"style": 4,
			"label": "Cancel/Help",
			"custom_id": "PreInterviewOption_help",
			"disabled": false,
			"emoji": { "name": "❔" },
			"type": 2
		}]
	}]
},
/********************************************************/
/*                 Set First Interview?                 */
/********************************************************/
{
	"embeds": [{
		"title": "Set First Interview?",
		"color": 4321431,
		"description": "Have you met with Ben Simon-Thomas before? Ben is one of our founders and takes the lead when it comes to first interviews and application screening. If you need to schedule a first interview still, you can compose a message for him here, and he will get back to you to set up an appointment."
	}],
	"components": [{
		"type": 1,
		"components": [{
			"style": 1,
			"label": "I have interviewed with Ben already",
			"custom_id": "PreInterviewOption_cont",
			"disabled": false,
			"emoji": { "name": "🤝" },
			"type": 2
		}, {
			"style": 1,
			"label": "I need a first interview",
			"custom_id": "PreInterviewOption_first_cont",
			"disabled": false,
			"emoji": { "name": "📅" },
			"type": 2
		}]
	}]
}
];

const menus = messageContents.map(function([name, content], index):
	[string, (interaction: ButtonInteraction<CacheType>) => Promise<boolean | void>]
{
	if(index < 1)
		return [name, SendMessage.bind({ content: content })];

	return [name, OpenSubFromContext.bind({ content: content })];
});

return [
	...menus,
	[PremainSend.name, PremainSend],
	[ConfPremainCancel.name, ConfPremainCancel],
];
}

async function StartPreInterviewApplication(button: ButtonInteraction<CacheType>)
{
	var content: MessageOptions = {
		embeds: [{
			author: { name: "Application For " + button.user.username },
			footer: {
				icon_url: IconLinks.Edit,
				text: `Editing Application with id '${button.message.id}'`
			}
		}, {
			description: "Loading...",
		}]
	};

	content.embeds[0].fields = content.components.slice(0, -2).flatMap(
		cs => cs.components.map((c: MessageButton) => {
			return {
				name: c.label,
				value: "`Incomplete`",
				inline: false
			};
	}));

	await (button.channel as TextBasedChannel).send(this.content);
}

async function PreChangeMenuFromContext(button: ButtonInteraction<CacheType>): Promise<void>
{
	var msg = await FetchButtonMessage(button);

	var content: ECO = this;

	content[0].author = OnboardingMod.author;

	msg.embeds[msg.embeds.length - 1] = new MessageEmbed(content[0]);
	msg.components = AddButtonsToRow(content[1].map(b => new MessageButton(b)));

	await CustomLock.WaitToHoldKey(msg.id, () => msg.edit({
		embeds: msg.embeds,
		components: msg.components
	}));
}

async function Conf(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button, this);
}

async function PreSubmenuSubmit(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button,
		"Are you sure you want to submit the application? Does everything look good?");
}

/********************************************************/
/*                      Submitted                       */
/********************************************************/
async function PremainSend(button: ButtonInteraction<CacheType>)
{
	const content: MessageOptions = 

	if (!await ConfirmButtonInteraction(button,
		"Are you sure you want to submit the application? Does everything look good?"))
		return true;

	
}

async function ConfPremainCancel(button: ButtonInteraction<CacheType>)
{
	return !await ConfirmButtonInteraction(button,
		"Are you sure you want to stop submitting an application? All information will not be posted nor saved.");
}


/********************************************************/
/*                  Start Application                   */
/********************************************************/
PreAppHome.MakeMenu({
	author: Authors.Application,
	title: "First Application! 👨‍💼",
	description: "This application has a few sections, mostly involving setting up personal information and ensuring you know where to get help. Each section is one button, and your answers will be recorded as you go. Once each section is complete, the submit button will activate letting you finish the application.",
	thumbnail: { url: "https://clipart.world/wp-content/uploads/2020/12/Paint-Splatter-clipart-3.png" },
},
	//
);