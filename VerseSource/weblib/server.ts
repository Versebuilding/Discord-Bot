import * as fs from 'fs';
import { Debug } from '../Logging';

const html = fs.readFileSync("./htmlfor_bot/log.html", 'utf8');
const http = require('http');

const server = http.createServer(function(req, res)
{
	const baseURL = req.protocol + '://' + req.headers.host + '/';
	const reqUrl = new URL(req.url, baseURL);
	if (reqUrl.pathname == '/index.html' || reqUrl.pathname == '/')
	{
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		let htmllog = Debug.GetLog().replaceAll("\n", "<br/>");
		let s = html.replace(/(<p id=('log'|"log")>)(.*?)(<\/p>)/gm, "<p id='log'>" + htmllog + "<\/p>");
		res.end(s);
	}
	else
	{
		var path = "./htmlfor_bot" + reqUrl.pathname;
		fs.readFile(path, function(err, data) {
			if (err)
			{
				res.statusCode = 404;
				res.setHeader('Content-Type', 'text');
				res.end(err.message);
			}
			else
			{
				res.statusCode = 200;
				res.end(data);
			}
		});
	}
})

var port = process.env.PORT || 3000;

server.listen(port, "0.0.0.0", function() {
	Debug.Log("Listening on Port " + port);
});
