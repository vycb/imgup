/**
 * Created by vach on 9/13/2014.
 */
var
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID,
	GridStore = require('mongodb').GridStore,
	mongolabcon = 'mongodb://vycb:123@ds029541.mongolab.com:29541/blog',
	localcon = 'mongodb://localhost:27017/blog',
	db;

MongoClient.connect(mongolabcon,{native_parser: true},function(err, database) {
  if(err) throw err;

  db = database;
});

exports.findAll = function(res, vh)
{
		db.collection("articles", function(error, coll)
		{
			coll.find({}, function(er, cur)
			{
				cur.each(function (err, doc)
				{
					if(doc){
						res.write(vh.list({result: doc || {} }));
					}
					else{
						res.write(vh.footer());

						res.end();
					}

				});
			});

	});

};

exports.findById = function(id, callback)
{
	db.collection("articles", function(error, coll)
	{
		coll.findOne({_id: new ObjectID(id)}, callback);

	});

};

/**
 * remove an articles from collection
 * @param id
 * @param callback
 */
exports.removeById = function(id, callback){
	if(!id) return;

	gcollection.findAndRemove({_id: new ObjectID(id)}, [['_id', 1]], function(err, doc){
		if(!doc){
			return callback({message: 'doc not found', err: err});
		}

		exports.fileUnlink(doc.fileId, function(err, result){
			console.log('fileUnlink: callback');
			return callback(err, result);
		});
	});
};

exports.fileUnlink = function(id, callback){
	if(!id){
		callback('fileUnlink: no id');
		return;
	}

	new GridStore(db, new ObjectID(id), 'r').open(function(err, gs){
		if(!gs){
			return callback({error: err, message: 'file not found'});
		}

		gs.unlink(function(err, result){
			gs.close(function(err, result){

				console.log(['in unlink ok', result ? result.filename : result]);

				return callback(err, result);
			});
		});
	});
};

/**
 * get an image from collection
 * @param id
 * @param res
 * @param callback
 */
exports.image = function(id, res, callback){
	if(!id){
		return callback('image: no id');
	}

	new GridStore(db, new ObjectID(id), 'r').open(function(err, gs){
		if(!gs){
			res.statusCode = 404;
			res.end();
			return callback("Image:GS=undefined");
		}

		res.writeHead(200,{"Content-Type": gs.metadata.mimetype});

		var stream = gs.stream(true);

		stream.on("data", function(chunk){
			res.write(chunk);
		});

		stream.on("end", callback);

		stream.on("close", function(){
			res.end();
			gs.close(callback);
		});

	});

};

exports.saveFile = function(form, callback){
	form.on('file', function(fieldname, file, filename, encoding, mimetype)
	{
		if (!filename) return file.resume();

		form.apinput.fileId = form.apinput.prevFileId ? new ObjectID(form.apinput.prevFileId): new ObjectID(form.apinput.fileId);

		new GridStore(db, form.apinput.fileId, filename, 'w').open(function(err, gs)
		{
			if(!gs){
				return callback({message:"saveFile: gs=undefined"});
			}

			gs.contentType = mimetype;
			gs.metadata = {articleId: new ObjectID(form.apinput._id)};
			var stream = gs.stream();
			file.pipe(stream);
		});
	});
};

exports.saveArticle = function(input, callback){
	input.date = new Date();
	if(input._id){
		input._id = new ObjectID(input._id);
	}
	if(!input.fileId){
		delete input.fileId;
	}
	delete input.prevFileId;

	db.collection("articles", function(er, coll)
	{
		coll.save(input,{safe: true}, callback);
	});
};