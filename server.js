var express = require('express');
var bodyParser = require('body-parser'); 
var ejs = require('ejs');

var MongoClient = require('mongodb').MongoClient;

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/views', express.static(__dirname + '/views'));

var db
var mongoUrlStr = process.env.CONNECT_STR;
MongoClient.connect(mongoUrlStr, function(err, database) {
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
    var masterInfo = {
        "typeA": {"masterDb":"kanji", "detailDb":"en_words", "template":"/views/kanji_je.ejs" },
        "typeB": {"masterDb":"kanji", "detailDb":"vn_words", "template":"/views/kanji_jv.ejs" },
        "typeC": {"masterDb":"en_words", "detailDb":"kanji", "template":"/views/kotoba_je.ejs" },
        "typeD": {"masterDb":"vn_words", "detailDb":"kanji", "template":"/views/kotoba_jv.ejs" },
    }
    
    var kanjicollection = db.collection('kanji_master');
    var wordscollection = db.collection('words');
    var kanjiCursor = kanjicollection.find(query).sort({'jlpt':-1});
    var lastRslt = [];
    kanjiCursor.count(function(err, count) {
        if (err) {
            return console.log(err)
        }

        kanjiCursor.forEach(function(kanji) {
            var kanjiRef = ((kanji.ref_words.length > 10) ? kanji.ref_words.slice(0,10) : kanji.ref_words);
            wordscollection.find({
                "id": {
                    $in: kanjiRef
                }
            }, {
                "_id": 0
            }).toArray(function(err, samples) {

                kanji["sample"] = [];
                kanji["sample"] = samples;
                lastRslt.push(kanji);

                if (lastRslt.length === count) {
                    ejs.renderFile(__dirname + '/views/index.mobile.ejs', {
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
