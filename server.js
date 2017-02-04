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

app.post('/start', function(req, res) {
	Revenger = new reveng.Revenger(mysql, req.body.host, req.body.port, req.body.user, req.body.password, req.body.database);
	Revenger.getTableSchema(res);
});

app.get('/tabledata', function(req, res) {
	Revenger.getData(res);
});

app.listen(8080, function() {
    console.log('Started Tals Pals ER Visualizer Server!');
});