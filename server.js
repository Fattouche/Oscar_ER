"use strict"
var fs = require('fs');
var mysql      = require('mysql');
var express    = require("express");
var bodyParser = require("body-parser");
var reveng     = require("./app/reveng")

var Revenger = null;

var app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/getprojects', function(req, res) {
	fs.readFile('app/projectData.json', 'utf8', function (err, data) {
		if (err) throw err;
		res.json(JSON.parse(data));
	});
});


app.post('/addproject', function(req, res) {
	fs.writeFile ("app/projectData.json", JSON.stringify(req.body), function(err) {
	    if (err) throw err;
	});
});

app.post('/saveproject', function(req, res) {
	var json = JSON.parse(fs.readFileSync("app/projectData.json").toString());
	for(var i=0;i<json.projectData.length;i++){
		if(req.body.database==json.projectData[i].database){
			if(req.body.level=="HIGH"){
				json.projectData[i].highLevel = req.body.data;
			}else{
				json.projectData[i].lowLevel = req.body.data;
			}
		}
	}
	fs.writeFile ("app/projectData.json", JSON.stringify(json), function(err) {
	    if (err) throw err;
	});
});

app.post('/connect', function(req, res) {
	Revenger = new reveng.Revenger(res, mysql, req.body.host, req.body.port, req.body.user, req.body.password, req.body.database);
});

app.post('/start', function(req, res) {
	Revenger.getTableSchema(res);
});

app.get('/tabledata', function(req, res) {
	Revenger.getData(res);
});

app.listen(8081, function() {
    console.log('Started Tals Pals ER Visualizer Server!');
});