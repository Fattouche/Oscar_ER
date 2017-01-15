"use strict"
var mysql      = require('mysql');
var express    = require("express");
var bodyParser = require("body-parser");
var reveng     = require("./app/reveng")

var databasename = "northwind";
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : databasename
});

var Revenger = new reveng.Revenger(connection, databasename);

var app = express();
app.use(bodyParser.json());

app.use(express.static('public'));



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/start', function(req, res) {
	Revenger.getTableSchema(res);
});

app.get('/tabledata', function(req, res) {
	Revenger.getData(res);
});

app.listen(8080, function() {
    console.log('Started!');
});