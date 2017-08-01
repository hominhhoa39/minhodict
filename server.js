const
express = require('express'), bodyParser = require('body-parser'), ejs = require('ejs'),
		MongoClient = require('mongodb').MongoClient;

const
app = express();
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use('/js', express.static(__dirname + '/js'));
app.use('/views', express.static(__dirname + '/views'));

var db

MongoClient.connect('mongodb://localhost:27017/dictionary', function(err, database) {
	if (err)
		return console.log(err)
	db = database
	app.listen(3000, function() {
		console.log('listening on 3000')
	})
})

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html')
})

app.get('/search', function(req, res) {
	var obj = req.query;
	obj.status = "successful";
	//console.log('body: ' + obj.sData + " " + obj.sType + " " + obj.sJlpt);
	//res.send(obj);
	var query = {};
	if (obj.sCon === 'and') {
		query["$and"] = [];
		var arr = obj.sData.split(',');
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].trim() !== "") {
				var inTemp = {};
				inTemp["$in"] = [];
				inTemp["$in"].push(arr[i].trim());
				var partTemp = {};
				partTemp[obj.sType] = inTemp;
				query["$and"].push(partTemp);
			}
		}
		if (obj.sJlpt !== "") {
			var jlptTemp = {};
			jlptTemp["jlpt"] = obj.sJlpt;
			query["$and"].push(jlptTemp);
		}
	} else {
		var arr = obj.sData.split(',');
		var inTemp = {};
		inTemp["$in"] = [];
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].trim() !== "") {
				inTemp["$in"].push(arr[i].trim());
			}
		}
		if (inTemp["$in"].length > 0) {
			query["$and"] = [];
			var partTemp = {};
			partTemp[obj.sType] = inTemp;
			query["$and"].push(partTemp);
			if (obj.sJlpt !== "") {
				var jlptTemp = {};
				jlptTemp["jlpt"] = obj.sJlpt;
				query["$and"].push(jlptTemp);
			}
		} else {
			if (obj.sJlpt !== "") {
				var jlptTemp = {};
				jlptTemp["jlpt"] = obj.sJlpt;
				query = jlptTemp;
			}
		}
	}
	//console.log(query);

	var dataSet = [];
	var kanjicollection = db.collection('kanji');
	var wordscollection = db.collection('words');
	var kanjiCursor = kanjicollection.find(query);
	var lastRslt = [];
	kanjiCursor.count(function(err, count) {
		if (err) {
			return console.log(err)
		}

		kanjiCursor.forEach(function(kanji) {
			wordscollection.find({
				"word": {
					$regex: kanji.ji
				}
			}, {
				"_id": 0
			}).toArray(function(err, samples) {

				kanji["sample"] = [];
				kanji["sample"] = samples;
				lastRslt.push(kanji);

				if (lastRslt.length === count) {
					ejs.renderFile(__dirname + '/views/index.ejs', {
						kanjis: lastRslt
					}, {}, function(err, str) {
						if (err) {
							return console.log(err);
						}
						res.send(str);
					});
				}
			});
		})
	});
});