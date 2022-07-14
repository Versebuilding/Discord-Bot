
// Regexp for matching stack trace.
const chromeRe = /^\s*at (.*?) ?\(?((?:file|node|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const chromeEvalRe = /\((\S*)(?::(\d+))(?::(\d+))\)/;

// Parse line for Chrome/NodeJS
function parseChrome(line: string) {
	const parts = chromeRe.exec(line);

	if (!parts) {
		return null;
	}

	const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
	const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line

	const submatch = chromeEvalRe.exec(parts[2]);
	if (isEval && submatch != null) {
		// throw out eval line/column and use top-most line/column number
		parts[2] = submatch[1]; // url
		parts[3] = submatch[2]; // line
		parts[4] = submatch[3]; // column
	}

	return {
		file: !isNative ? parts[2] : null,
		methodName: parts[1] || "file-top",
		arguments: isNative ? [parts[2]] : [],
		lineNumber: parts[3] ? +parts[3] : null,
		column: parts[4] ? +parts[4] : null,
	};
}

/**
 * Returns the function data from a call that is 'index' down from the top of the stack.
 * Returns null if index is out of bounds or 
 * @param stack String generated from Error().stack.
 * @param index Index of call, starting from the top.
 * @returns Call object with data on the function call.
 */
export function parseStackIndex(stack: string | undefined, index: number)
{
	if (stack)
	{
		const lines = stack.split('\n');

		if (lines[index])
		{
			var parse = parseChrome(lines[index]);

			if (parse)
				return parse;
		}
	}

	return {
		file: null,
		methodName: "none",
		arguments: [],
		lineNumber: null,
		column: null,
	};
}

/**
 * Returns the function data from call calls in a stack.
 * @param stack String generated from Error().stack.
 * @returns Calls with data from the function calls.
 */
export function parseStack(stack: string | undefined)
{
	if (!stack) return [];

	const lines = stack.split('\n');

	var calls: {
		file: string | null;
		methodName: string;
		arguments: string[];
		lineNumber: number | null;
		column: number | null;
	}[] = [];

	lines.forEach(line => {
		const parseResult = parseChrome(line);

		if (parseResult) {
			calls.push(parseResult);
		}
	});

	return calls;
}