// const { google } = require("googleapis");
import { GoogleAuth } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { google, sheets_v4 } from "googleapis";
import { Debug } from "./util";

export class SheetsWrapper
{
	static auth: GoogleAuth<JSONClient>;
	static gsInstance: sheets_v4.Sheets;

	static async Initialize()
	{
		this.auth = new google.auth.GoogleAuth({
			keyFile: process.env.GOOGLE_KEY_FILE,
			//url to spreadsheets API
			scopes: "https://www.googleapis.com/auth/spreadsheets", 
		});
	
		const authClientObject = await this.auth.getClient();
		this.gsInstance = google.sheets({ version: "v4", auth: authClientObject });
	}

	static async ReadAll(sheetname: string = "Sheet1"): Promise<sheets_v4.Schema$ValueRange>
	{
		return (await this.gsInstance.spreadsheets.values.get({
			auth: this.auth,
			spreadsheetId: process.env.GOOGLE_DATA_DOCUMENT,
			range: sheetname,
		})).data;
	}

	static async UpdateRow({ values, row, sheetname = "Sheet1" }:
		{ values: string[]; row: number, sheetname?: string; }):
			Promise<sheets_v4.Schema$UpdateValuesResponse>
	{
		Debug.Log("Updating at row " + row);
		return (await this.gsInstance.spreadsheets.values.update({
			auth: this.auth,
			spreadsheetId: process.env.GOOGLE_DATA_DOCUMENT,
			range: sheetname + `!A${row}:ZZZ${row}`,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]},
		})).data;
	}

	static async AppendRow({ values, sheetname = "Sheet1" }: { values: string[]; sheetname?: string; })
		: Promise<sheets_v4.Schema$AppendValuesResponse>
	{
		return (await this.gsInstance.spreadsheets.values.append({
			auth: this.auth,
			spreadsheetId: process.env.GOOGLE_DATA_DOCUMENT,
			range: sheetname + "!A1:Z1000",
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]}
		})).data;
	}
}