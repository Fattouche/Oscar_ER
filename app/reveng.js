"use strict"
class Revenger{

	constructor(db, databasename){
		this.db = db;
		this.databasename = databasename;
		this.tables = [];
		this.links = [];
  // 	table type:
  // 	{
  //       key: 14,
  //       name: "Course",
  //       properties: [
  //         { name: "name", type: "String", visibility: "public" },
  //         { name: "description", type: "String", visibility: "public" },
  //         { name: "professor", type: "Professor", visibility: "public" },
  //         { name: "location", type: "String", visibility: "public" },
  //         { name: "times", type: "List<Time>", visibility: "public" },
  //         { name: "prerequisites", type: "List<Course>", visibility: "public" },
  //         { name: "students", type: "List<Student>", visibility: "public" }
  //       ]
  //    }

  //	link type:
  //	{ from: 12, to: 11, relationship: "generalization" }
	}

	getData(res){
		res.json({tables: this.tables, links: this.links})
	}

	getTableSchema(res){
		var self = this;
		self.tables = [];
		self.links = [];
		var db = this.db;
		db.query("USE "+this.databasename+";");
		db.query("SELECT table_name \
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
					"foreign_keys": []
				}
				self.getTableForeignKeys(new_table);
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
		});
	}
	
	getTableForeignKeys(new_table) {
		var self = this;
		this.db.query("USE "+this.databasename+";");
		this.db.query("SELECT information_schema.REFERENTIAL_CONSTRAINTS.REFERENCED_TABLE_NAME \
					   FROM information_schema.REFERENTIAL_CONSTRAINTS \
					   WHERE information_schema.REFERENTIAL_CONSTRAINTS.TABLE_NAME = '" + new_table.name + "';",
					   function(err, rows, fields) {
							if (!err) {								
								for (var i in rows) {
									self.links.push({"from": new_table.name, "to": rows[i]["REFERENCED_TABLE_NAME"]});
								}
							} else {
								console.log("error: " + err);
								throw err;
							}
						}
		);
	}

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
					self.tables.push(new_table);
					if (res)
						res.send(null);
				  }
				  else{
					console.log('Error while performing Query.');
					throw err;
				  }
				});
	}

	generateLinks(){

	}
}

module.exports = {
	Revenger: Revenger
};