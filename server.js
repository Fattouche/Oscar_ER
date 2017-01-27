"use strict"
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

app.post('/start', function(req, res) {
	Revenger = new reveng.Revenger(mysql, req.body.host, req.body.port, req.body.user, req.body.password, req.body.database);
	Revenger.getTableSchema(res);
});

app.get('/tabledata', function(req, res) {
	Revenger.getData(res);
});

app.listen(8080, function() {
    console.log('Started!');
});