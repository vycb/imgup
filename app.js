/**
 * Created by vach on 9/13/2014.
 */
var express = require("express"),
	app = module.exports = express(),
	logger = require('morgan'),
	ejs = require('ejs'),
	fs = require('fs'),
	Busboy = require('busboy'),
	article = require("./article"),
	vh = require("./views/")
	;

app.use(logger('dev'));
app.disable('etag');
//app.engine('.html', ejs.__express);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'html');

// Routes list all articles adn / root
app.get("/", index);
app.get("/articles", index);

/**
 * routing function for index/show articles
 * @param req
 * @param res
 */
function index(req, res){

	res.write(vh.head());

	article.findAll(function(error, result)
	{
		if(result){
			res.write(vh.list({
				result: result || {}
			}));
		}
		else{
			res.write(vh.footer());

			res.end();
		}
	});
}

/**
 * route to get image
 */
app.get("/image/:id", function(req, res){
	
});

/**
 * route to show edit article's form
 */
app.get("/article/:id", function(req, res){

	article.findById(req.params.id, function(error, result){
		if(error){
			res.status(400);
			console.log(error);
		}else if(!result){
			res.status(404);
		}

		res.write(vh.form({ result: result, orempty: vh.orempty}));

		res.end();
	});
});

/**
 * route to remove article
 */
app.get("/article/:id/remove", function(req, res)
{
	article.removeById(req.params.id, function(error, result){
		if(error){
			res.status(400);
			console.log(error.message);
		}

		res.redirect('/articles');

		res.end();
	});
});

/**
 * route to edit an article
 */
app.post("/article", function(req, res, next){
	var form = new Busboy({ headers: req.headers });
			form.apinput = {};

	form.on('field', function(name, val, fieldnameTruncated, valTruncated){
		if(!val) return;
		else
			form.apinput[name] = val;

	});

	article.saveFile(form, function(err, gs){
		console.log(err);
	});

	form.on('finish', function()
	{
		if(!form.apinput.fileId && form.apinput.prevFileId){ //the previous image in doc to be deleted
			article.fileUnlink(form.apinput.prevFileId, function(error, gs){
				console.log(error);
			});
		}

		article.saveArticle(form.apinput, function(err, objects){
			if(err){
				res.status(400);
				console.log(err.message);
			}
			res.headers = null;
			res.redirect('/article/' + form.apinput._id);
//			res.end();
		});
	});
	req.pipe(form);
});

/**
 * route to show article's form
 */
app.get("/form", function(req, res){

	res.write(vh.form({result: {}}));

	res.end();
});

app.use(express.static(__dirname + "/views"));

app.use(function (req, res) {
	res.status(404);

	res.write(vh.e404({url: req.url}));

	res.end();
});


if(!module.parent){
	app.listen(3000);
	console.log('Express started on port 3000');
}