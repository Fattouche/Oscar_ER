"use strict"
var fs = require('fs');
var mysql = require('mysql');
var express = require("express");
var bodyParser = require("body-parser");
var reveng = require("./app/reveng");

var Revenger = null;
var database = null;

var app = express();
app.use(bodyParser.json({limit: '50mb'}));

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/getprojects', function(req, res) {
    fs.readFile('app/projectData.json', 'utf8', function(err, data) {
        if (err) throw err;
        res.json(JSON.parse(data));
    });
});


app.post('/addproject', function(req, res) {
    fs.writeFile("app/projectData.json", JSON.stringify(req.body), function(err) {
        if (err) throw err;
    });
});

app.post('/saveproject', function(req, res) {
    var json = JSON.parse(fs.readFileSync("app/projectData.json").toString());
    for (var i = 0; i < json.projectData.length; i++) {
        if (req.body.database == json.projectData[i].database) {
            if (req.body.level == "HIGH") {
                json.projectData[i].highLevelNode = req.body.nodeData;
                json.projectData[i].highLevelLink = req.body.linkData;
                json.projectData[i].highLevelHidden = req.body.hidden;
                //console.log(req.body.onHighLevelView);
                json.projectData[i].onHighLevelView = req.body.onHighLevelView;
            } else {
                json.projectData[i].lowLevelNode = req.body.nodeData;
                json.projectData[i].lowLevelLink = req.body.linkData;
                json.projectData[i].lowLevelHidden = req.body.hidden;
                //console.log(req.body.onHighLevelView);
                json.projectData[i].onHighLevelView = req.body.onHighLevelView;
            }
        }
    }
    fs.writeFile("app/projectData.json", JSON.stringify(json), function(err) {
        if (err) throw err;
    });
});

app.post('/connect', function(req, res) {
	if (req.body.codeDir){
		if (!fs.existsSync(req.body.codeDir)){
			res.json({
				connect: false,
				message: "Invalid source directory"
			});
			return
		}
	}
    database = req.body.database;
    Revenger = new reveng.Revenger(res, mysql, req.body.host, req.body.port, req.body.user, req.body.password, req.body.database, req.body.codeDir);
});

app.post('/start', function(req, res) {
    var json = JSON.parse(fs.readFileSync("app/projectData.json").toString());
    var sent = false;
    for (var i = 0; i < json.projectData.length; i++) {
        if (database == json.projectData[i].database) {
            if (json.projectData[i].hasOwnProperty('highLevelNode')) {
                Revenger.data = json.projectData[i];
                sent = true;
                res.send();
            }
        }
    }
    if (!sent)
        Revenger.getTableSchema(res);
});

app.get('/tabledata', function(req, res) {
    Revenger.getData(res);
});

app.listen(8081, function() {
    console.log('Started Tals Pals ER Visualizer Server!');
});