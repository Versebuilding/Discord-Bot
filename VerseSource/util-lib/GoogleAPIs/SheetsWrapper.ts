// const { google } = require("googleapis");
import { GoogleAuth } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { google, sheets_v4 } from "googleapis";
import { GoogleClient } from "./GoogleClient";

export namespace SheetsHelpers
{
	export async function ReadCell(row: number, col: string, sheetname: string = "Sheet1", docID?: string): Promise<any | null>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		const data = (await GoogleClient.SheetsClient.spreadsheets.values.get({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + `!${col}${row}:${col}${row}`,
		})).data.values;

		if (data && data[0] && data[0][0]) return data[0][0];
		else return null;
	}

	export async function ReadCol(col: string, sheetname: string = "Sheet1", docID?: string): Promise<any[]>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.get({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + `!${col}1:${col}5000`,
		})).data.values.map(v => v[0]);
	}

	export async function ReadRow(row: number, sheetname: string = "Sheet1",  docID?: string): Promise<any[]>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.get({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + `!A${row}:ZZZ${row}`,
		})).data.values[0];
	}

	export async function ReadAll(sheetname: string = "Sheet1",  docID?: string): Promise<sheets_v4.Schema$ValueRange>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.get({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname,
		})).data;
	}

	export async function UpdateCell(value: string, cell: string, sheetname = "Sheet1", docID?: string)
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.update({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + `!${cell}:${cell}`,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ [ value ] ]},
		})).data;
	}

	export async function UpdateRow({ values, row, sheetname = "Sheet1", docID }:
		{ values: string[]; row: number, sheetname?: string; docID?: string }):
			Promise<sheets_v4.Schema$UpdateValuesResponse>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.update({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + `!A${row}:ZZZ${row}`,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]},
		})).data;
	}

	export async function AppendRow({ values, sheetname = "Sheet1", docID }:
		{ values: string[]; sheetname?: string; docID?: string })
		: Promise<sheets_v4.Schema$AppendValuesResponse>
	{
		if (!docID) docID = process.env.GOOGLE_DATA_DOCUMENT;
		return (await GoogleClient.SheetsClient.spreadsheets.values.append({
			auth: GoogleClient.auth,
			spreadsheetId: docID,
			range: sheetname + "!A1:Z1000",
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [ values ]}
		})).data;
	}

	export function toBase26(num: number): string
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