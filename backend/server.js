var mysql      = require('mysql');
var express    = require("express");
var bodyParser = require("body-parser");
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : '< MySQL username >',
  password : '< MySQL password >',
  database : '<your database name>'
});

var app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(8080, function() {
    console.log('Started!');
});

var table_names;

function start(){
	connection.connect();

	connection.query(
					"SELECT table_name \
					FROM information_schema.tables \
					where table_schema='<your_database_name>';", function(err, rows, fields) {
	  if (!err){
		table_names = rows;
		console.log('The solution is: ', rows);
	  }
	  else
		console.log('Error while performing Query.');
	});


	connection.end();
}