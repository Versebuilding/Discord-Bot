import { GoogleAuth } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { sheets_v4, google } from "googleapis";

export namespace GoogleClient
{
	export var SheetsClient: sheets_v4.Sheets;
	export var auth: GoogleAuth<JSONClient>;

	export async function Initialize()
	{
		GoogleClient.auth = new google.auth.GoogleAuth({
			keyFile: process.env.GOOGLE_KEY_FILE,
			//url to spreadsheets API
			scopes: "https://www.googleapis.com/auth/spreadsheets",
		});

		const authClientObject = await auth.getClient();
		SheetsClient = google.sheets({ version: "v4", auth: authClientObject });
	}
}