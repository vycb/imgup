var numr, pid,
http = require('http'),
estatic = require('ecstatic'),
fs = require('fs'),
ejs = require('ejs'),
Busboy = require('busboy'),
article = require("./article"),
vh = require("./views/"),
serve = estatic({root: __dirname+'/public', serverHeader: false,
	showDir:true, autoIndex: false, baseDir:"/public"});

http.Server(function(req, res, next){
		if(req.url.indexOf("public") >-1){
			serve(req, res, next);
		}
		else{
			res.writeHead(200, {'content-type': 'text/html'});
			res.write(index({hello: "Hello nodejs!",
				numr: numr, pid: pid}));

			res.end();
		}

}).listen(8000);
