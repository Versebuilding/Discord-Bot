import { Channels } from "../util-lib";
import { parseStack, parseStackIndex } from "./StackParser";
const path = require('node:path');

const config =
{
	logLength: 10000,
	prefixSpacing: false,
	logFlags: {
		line: true,
		file: true,
		method: false,
		args: false,
	},
}
export namespace Debug
{

	export const ColorReference = {
		Reset: "\x1b[0m",
		Bright: "\x1b[1m",
		Dim: "\x1b[2m",
		Underscore: "\x1b[4m",
		Blink: "\x1b[5m",
		Reverse: "\x1b[7m",
		Hidden: "\x1b[8m",

		FgBlack: "\x1b[30m",
		FgRed: "\x1b[31m",
		FgGreen: "\x1b[32m",
		FgYellow: "\x1b[33m",
		FgBlue: "\x1b[34m",
		FgMagenta: "\x1b[35m",
		FgCyan: "\x1b[36m",
		FgWhite: "\x1b[37m",

		BgBlack: "\x1b[40m",
		BgRed: "\x1b[41m",
		BgGreen: "\x1b[42m",
		BgYellow: "\x1b[43m",
		BgBlue: "\x1b[44m",
		BgMagenta: "\x1b[45m",
		BgCyan: "\x1b[46m",
		BgWhite: "\x1b[47m",
	}

	export function C<T extends keyof typeof ColorReference>(color: T, str: string)
	{
		return ColorReference[color] + str + ColorReference["Reset"];
	}

	var log: string = "## Beginning of log ##\n";

	function _print(args: string[], printStack = false)
	{
		const stack = Error().stack;
		const caller = parseStackIndex(stack, 3);

		const prefix = createPrefix(caller);


		args.forEach(str =>{
			console.log(prefix + str);
			log += (prefix + str + "\n").replace(/\[[0-9]+m/g, "");
		});

		if (printStack)
		{
			var append = stack.substring(stack.indexOf("\n    ")) + "\n";
			console.log(append);
			log += (append + "\n").replace(/\[[0-9]+m/g, "");
		}

		const trimto = log.length - config.logLength;
		if (trimto > 0)
		{
			log = log.substring(trimto, log.length);
		}
	}

	function toStrings(args: any[])
	{
		var out: string[] = [];
		
		for (let i = 0; i < args.length; i++)
		{
			if (!args[i])
				out.push("null");

			else if (typeof args[i].stack === 'string' &&
					typeof args[i].name === 'string' &&
					typeof args[i].message === 'string')
			{
				out.push(C("FgRed", args[i].name) + ": " +	C("FgRed", args[i].message) + "\n" + args[i].stack.substring(args[i].stack.indexOf("\n") + 1));
			}
			else if (args[i].toString === Object.prototype.toString)
			{
				const str = JSON.stringify(args[i], null, 1);
				out.push(str.substring(1, str.length - 1));
			} else
			{
				out.push(args[i].toString());
			}
		}

		return out;
	}

	function createPrefix(caller: {
		file: string | null;
		methodName: string;
		arguments: string[];
		lineNumber: number | null;
		column: number | null;
	})
	{
		const file: string = caller.file ? path.basename(caller.file, path.extname(caller.file)) : "unknown";
		const line: string = caller.lineNumber?.toString() ?? "N/A";
		const col: string = caller.column?.toString() ?? "N/A";

		var result: string = "";

		if (config.logFlags.file)
			result += "" + C("FgCyan", config.prefixSpacing ? file : file.padStart(10).substring(0,10)) + ":";
		if (config.logFlags.line)
		{
			result += C("FgYellow", line) + ":";
			result += C("FgYellow", config.prefixSpacing ? col : col.padEnd(6 - line.length).substring(0,6 - line.length)) + "|";
		}
		if (config.logFlags.method)
			result += " " + C("FgBlue", (config.prefixSpacing ? caller.methodName : caller.methodName.padEnd(14).substring(0,14))) + (config.logFlags.args ? "" : "_");

		if (config.logFlags.args)
			result += "(" + caller.arguments.join(", ") + ")";
		else result = result.substring(0, result.length - 1);

		return result + "$ ";
	}

	export function Endl()
	{
		console.log("");
		log += "\n";
		return "";
	}

	export function LogInline(...args: any[]) { _print([toStrings(args).join("")]); }
	export function Log(...args: any[]) { _print(toStrings(args)); }
	export function Print(...args: any[]) { _print(toStrings(args)); }

	export function LogEvent(name: string, ...args: any[])
		{ _print(toStrings(args).map(s => C("FgCyan", `<< ${name} >> `) + s)); }

	export function LogSuccess(...args: any[])
		{ _print(toStrings(args).map(s => C("FgGreen", "<< Success >> ") + s)); }

	export function LogWarning(...args: any[])
		{ _print(toStrings(args).map(s => C("FgYellow", "<< Warning >> ") + s)); }

	export function LogError(...args: any[])
		{ _print(toStrings(args).map(s => C("BgRed", "<<--ERROR-->> ") + s)); }

	export function TraceWarning(...args: any[])
		{ _print(toStrings(args).map(s => C("FgYellow", "<< Warning >> ") + s), true); }

	export function TraceError(...args: any[])
		{ _print(toStrings(args).map(s => C("BgRed", "<<--ERROR-->> ") + s), true); }

	export function Critical(...args: any[])
	{
		Banner("BgRed", "Critical Error", ...args)
	}

	export function Banner<T extends keyof typeof ColorReference>(color: T, title: string, ...args: any[])
	{
		if (title.length > 42)
			title.substring(0, 42);

		title = "  " + title + "  ";
		title = title.padEnd(title.length + Math.ceil((46 - title.length) / 2)).padStart(46);
		title = "/*" + title + "*/";

		var middle = "";
		if (args.length > 0)
			middle = toStrings(args).join("\n") + "\n";

		_print([
			C(color, "\n/************************************************/\n" + title + "\n") +
			middle +
			C(color, "/************************************************/\n")
		]);
	}

	export function GetLog() { return log; }
}