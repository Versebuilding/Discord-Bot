// const { google } = require("googleapis");
import { GoogleAuth } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { google, sheets_v4 } from "googleapis";

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

	static async ReadCell(row: number, col: string, sheetname: string = "Sheet1", docID?: string): Promise<any | null>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		const data = (await this.gsInstance.spreadsheets.values.get({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + `!${col}${row}:${col}${row}`,
		})).data.values;

		if (data && data[0] && data[0][0]) return data[0][0];
		else return null;
	}

	static async ReadCol(col: string, sheetname: string = "Sheet1", docID?: string): Promise<any[]>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.get({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + `!${col}1:${col}5000`,
		})).data.values.map(v => v[0]);
	}

	static async ReadRow(row: number, sheetname: string = "Sheet1",  docID?: string): Promise<any[]>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.get({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + `!A${row}:ZZZ${row}`,
		})).data.values[0];
	}

	static async ReadAll(sheetname: string = "Sheet1",  docID?: string): Promise<sheets_v4.Schema$ValueRange>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.get({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname,
		})).data;
	}

	static async UpdateCell(value: string, cell: string, sheetname = "Sheet1", docID?: string)
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.update({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + `!${cell}:${cell}`,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ [ value ] ]},
		})).data;
	}

	static async UpdateRow({ values, row, sheetname = "Sheet1", docID }:
		{ values: string[]; row: number, sheetname?: string; docID?: string }):
			Promise<sheets_v4.Schema$UpdateValuesResponse>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.update({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + `!A${row}:ZZZ${row}`,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]},
		})).data;
	}

	static async AppendRow({ values, sheetname = "Sheet1", docID }:
		{ values: string[]; sheetname?: string; docID?: string })
		: Promise<sheets_v4.Schema$AppendValuesResponse>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await this.gsInstance.spreadsheets.values.append({
			auth: this.auth,
			spreadsheetId: docID,
			range: sheetname + "!A1:Z1000",
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]}
		})).data;
	}

	static toBase26(num: number): string
	{
		let alphas = ""; num++;
		do {
			let r = num % 26;
			num = Math.floor(num / 26);
			if (r == 0) { r += 26; num--; }
			alphas = String.fromCharCode(64 + r) + alphas; 
		} while (num > 0);

		return alphas;
	}
}