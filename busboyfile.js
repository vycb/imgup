/**
 * Created by vach on 9/22/2014.
 */
var http = require('http'),
	path = require('path'),
	os = require('os');

var Busboy = require('busboy');

http.createServer(function(req, res){
	if (req.url === '/') {
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(
				'<form action="/upload" enctype="multipart/form-data" method="post">'+
				'<input type="text" name="title"><br>'+
				'<input type="file" name="image" multiple="multiple"><br>'+
				'<input type="submit" value="Upload">'+
				'</form>'
		);
	}

	if(req.url =='/upload' && req.method == "POST"){
		!req.headers ?{"content-type": "image/jpeg"} : req.headers;

		var busboy = new Busboy({ headers: req.headers });

		res.writeHead(200, {
			"Content-Type": "image/jpeg"
		});

		/*busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
			var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
			file.pipe(fs.createWriteStream(saveTo));
		});*/
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
			var data=[];
			file.on('data', function(chunk) {
				data.push(chunk);
				console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
//				res.write(data);
			});

			file.on('end', function() {
				res.write(Buffer.concat(data));
				console.log('File [' + fieldname + '] Finished');
			});
		});

		busboy.on('finish', function(){
//			res.writeHead(200, { 'Connection': 'close' });
			res.end();
		});

		return req.pipe(busboy);
	}
	else{
		res.writeHead(302, {'location': '/'});
		res.end();
		return;
	}

	res.writeHead(404);
	res.end();
}).listen(8000, function(){
	console.log('Listening for requests');
});