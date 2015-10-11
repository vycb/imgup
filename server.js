var http = require('http'),
estatic = require('ecstatic'),
pathRegexp = require('path-to-regexp'),
Busboy = require('busboy'),
article = require("./article"),
vh = require("./views/"),
serve = estatic({root: __dirname+'/public', serverHeader: false,
	showDir:true, autoIndex: false, baseDir:"/public"}),
getUrlParam = function(templ, url){
	var keys = [],
	regexp = pathRegexp(templ, keys);
	return regexp.exec(url);
};

http.Server(function(req, res, next){


	if(req.url.indexOf("public") >-1){
		serve(req, res, next);
	}
	else if(req.url === ("/form")){
		res.write(vh.form({result: {}}));

		res.end();
	}
	else if(req.url.indexOf("/image/") >-1)
	{
		article.image(getUrlParam("/image/:id", req.url)[1], res, function(error, result){
				if(error){
					console.log(error);
		//			res.json(error, 400);
				}else if(!result){
		//			res.statusCode = 404;
				}
				res.end();
		});
	}
	else if(req.method === "GET" && req.url.indexOf("/article/") >-1){

		article.findById(getUrlParam("/article/:id", req.url)[1], function(error, result){
			if(error){
				res.statusCode = 400;
				console.log(error);
			}else if(!result){
				res.statusCode = 404;
			}

			res.write(vh.form({ result: result, orempty: vh.orempty}));

			res.end();
		});

	}
	else if(req.method === "POST" && req.url === "/addarticle")
	{
		var form = new Busboy({ headers: req.headers });
		form.apinput = {};

		form.on('field', function(name, val){
			if(!val) return; else form.apinput[name] = val;
		});

		article.saveFile(form, function(err, gs){ console.log(err); });

		form.on('finish', function()
		{
			if(!form.apinput.fileId && form.apinput.prevFileId){ //the previous image in doc to be deleted
				article.fileUnlink(form.apinput.prevFileId, function(error, gs){
					console.log(error);
				});
			}

			article.saveArticle(form.apinput, function(err, objects){
				if(err){
					res.statusCode = 400;
					console.log(err.message);
				}

				res.headers = null;
				res.writeHead(301, {Location: '/article/' + form.apinput._id});
res.end();
			});
		});

		req.pipe(form);

	}
	else // index
	{
		res.writeHead(200, {'content-type': 'text/html'});
		/**
		* routing function for index/show articles
		* @param req
		* @param res
		*/
		(function index(req, res){

			res.write(vh.head());

			article.findAll(res, vh);

		})(req, res);

	}

}).listen(8000);
