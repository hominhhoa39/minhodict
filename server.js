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

MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dictionary', function(err, database) {
//MongoClient.connect(, function(err, database) {
    if (err)
        return console.log(err)
    db = database
    app.listen(process.env.PORT || 8080, function() {
        console.log("App now running on port");
    })
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

app.get('/search', function(req, res) {
    var obj = req.query;
    obj.status = "successful";
    var query = {};
    var arr;
    var smpNum = obj.sNum;
    var langVal = obj.sLang;
    if (obj.sType === "ji") {
        var tmpData = obj.sData.replace(/[\s　,、.。;；]/g, '');
        var patt = /[\u4E00-\u9FAF]/;
        arr = [];
        for (var i=0; i< tmpData.length; i++) {
            if (tmpData[i].match(patt)) {
                arr.push(tmpData[i]);
            }
        }
    } else {
        arr = obj.sData.split(/[\s　,、.。;；]+/);
    }
    //AND condition
    if (obj.sCon === 'and') {
        query["$and"] = [];
        
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
        if (obj.sJlpt !== "" && obj.sType !== "ji") {
            var jlptTemp = {};
            jlptTemp["jlpt"] = obj.sJlpt;
            query["$and"].push(jlptTemp);
        }
    } else {
    // OR condition
        //var arr = obj.sData.split(',');
        /* console.log("1");
        if ( obj.sType = "kun" && obj.sSubType === undefined && obj.sData.indexOf("*") >= 0) {
            console.log("1.1");
            var orTemp = {};
            orTemp["$or"] = [];
            for (var i = 0; i < arr.length; i++) {
                var tempData = arr[i].trim();
                var firstChar = tempData.charAt(0);
                var lastChar = tempData.charAt(tempData.length - 1);
                var regexKun = {};
                var kunX = ((tempData.indexOf("・") >= 0) ? "kun.reading" : "kun.full"); */
                //var finalTmpData = tempData.replace(/\*/g, "");
            /*    if (firstChar === "*" && lastChar === "*") {
                    regexKun[kunX] = new RegExp(finalTmpData, "i");
                } else if ( firstChar !== "*" && lastChar === "*") {
                    regexKun[kunX] = new RegExp('^' + finalTmpData);
                } else if ( firstChar === "*" && lastChar !== "*") {
                    regexKun[kunX] = new RegExp(finalTmpData + '$');
                } else {
                    regexKun[kunX] = finalTmpData;
                }
                orTemp["$or"].push(regexKun);
            }
            query["$and"] = [];
            query["$and"].push(orTemp);
            if (obj.sJlpt !== "") {
                var jlptTemp = {};
                jlptTemp["jlpt"] = obj.sJlpt;
                query["$and"].push(jlptTemp);
            }
        } else {
            console.log("1.2");
        */
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
                var mainField = ((obj.sSubType !== undefined) ? (obj.sType + "." + obj.sSubType) : (obj.sType) );
                partTemp[mainField] = inTemp;
                query["$and"].push(partTemp);
                if (obj.sJlpt !== "") {
                    var jlptTemp = {};
                    jlptTemp["jlpt"] = obj.sJlpt;
                    query["$and"].push(jlptTemp);
                }
            } else {
                if (obj.sJlpt !== "" && obj.sType !== "ji") {
                    var jlptTemp = {};
                    jlptTemp["jlpt"] = obj.sJlpt;
                    query = jlptTemp;
                }
            }
        //}
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
            var kanjiRef = ((kanji.ref_words.length > smpNum) ? kanji.ref_words.slice(0, smpNum) : kanji.ref_words);
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
                    var ejsFile = "";
                    if (langVal === "vn") {
                        ejsFile = '/views/index.mobile.vn.ejs';
                    } else {
                        ejsFile = '/views/index.mobile.ejs';
                    }
                    ejs.renderFile(__dirname + ejsFile, {
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