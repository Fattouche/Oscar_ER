"use strict"
class Revenger{

	constructor(res, mysql, host, port, user, password, database){
		this.db = mysql.createConnection({
		  host     : host,
		  port     : port,
		  user     : user,
		  password : password,
		  database : database
		});
		this.databasename = database;
		this.links = [];
		this.tables = {};
		this.db.connect(function(err) {
			if (err){
				res.json({connect: false});
			}
			else {
				res.json({connect: true});
			}
		});

	} //end constructor
/*
   	example format of this.tables:
   	{	
		(table name here) : {
	        key: 14,
	        name: "Course",
	        properties: [
	           { name: "name", type: "String", visibility: "public" },
	           { name: "description", type: "String", visibility: "public" },
	           { name: "professor", type: "Professor", visibility: "public" },
	           { name: "location", type: "String", visibility: "public" },
	           { name: "times", type: "List<Time>", visibility: "public" },
	           { name: "prerequisites", type: "List<Course>", visibility: "public" },
	           { name: "students", type: "List<Student>", visibility: "public" }
	        ]
	    }
  	}

  	example format of this.links:
	[
  		{ from: 12, to: 11, relationship: "generalization" }
	]
*/

	getData(res){
		res.json({tables: this.tables, links: this.links})
	} //end getData

	getTableSchema(res){
		var self = this;
		self.tables = {};
		self.links = [];
		this.db.query("USE "+this.databasename+";");
		this.db.query("SELECT table_name \
				  FROM information_schema.tables \
				  WHERE table_schema=\""+this.databasename+"\";", function(err, rows, fields) {
		  if (!err){
		  	var table_names = rows;

			for (var i = 0; i < table_names.length; i++){
				var name = table_names[i].table_name;
				var new_table = {
					"key": name,
					"name": name,
					"properties": [],
					"foreign_keys": [],
					"outgoing_links": [],
					"incoming_links": []
				}
				if (i == table_names.length-1) // last one
					self.getTableProperties(new_table, res);
				else
					self.getTableProperties(new_table);
			}
		  }
		  else{
			console.log('Error while performing Query.');
			throw err;
		  }
		} //end SELECT callback
		); // end SELECT query
	} //end getTableSchema
	
	getTableForeignKeys(res) {
		var self = this;
		this.db.query("SELECT information_schema.REFERENTIAL_CONSTRAINTS.TABLE_NAME, \
					   information_schema.REFERENTIAL_CONSTRAINTS.REFERENCED_TABLE_NAME \
					   FROM information_schema.REFERENTIAL_CONSTRAINTS;",
					   function(err, rows, fields) {
							if (!err) {								
								for (var i in rows) {
									var fromName = rows[i].TABLE_NAME;
									var toName = rows[i].REFERENCED_TABLE_NAME;
									self.links.push({"from": fromName, "to": toName});
									if (self.tables[fromName] != undefined &&
											self.tables[toName] != undefined) {
												
										self.tables[fromName].outgoing_links.push(toName);
										self.tables[toName].incoming_links.push(fromName);
									}
								}
								self.db.end();
								res.send(null);
							} else {
								console.log("error: " + err);
								throw err;
							}
						} //end SELECT callback
		); //end SELECT query
	} //end getTableForeignKeys

	getTableProperties(new_table, res){
		var self = this;
		this.db.query("SELECT * \
					   FROM information_schema.columns \
  				  	   WHERE table_name = \""+new_table.name+"\" \
  				  	   AND table_schema=\""+this.databasename+"\";", function(err, rows, fields) {
				  if (!err){
					for (var j = 0; j < rows.length; j++){
						new_table.properties.push({
													name: rows[j].COLUMN_NAME,
													type: rows[j].DATA_TYPE,
													visibility: "public"
												});
					}
					self.tables[new_table.name] = new_table;
					if (res)
						self.getTableForeignKeys(res);
				  }
				  else{
					console.log('Error while performing Query.');
					throw err;
				  }
				} //end SELECT callback
		); //end SELECT query
	} //end getTableProperties
} //end class Revenger

module.exports = {
	Revenger: Revenger
};