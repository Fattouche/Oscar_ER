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
    this.ERtables = [];
    this.ERlinks = [];
	this.data = null;
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
    res.json({tables: this.tables, links: this.links, database:this.databasename, data:this.data})
  } //end getData

  
  getTableSchema(res){
    var self = this;
    self.tables = {};
    self.links = [];
    this.db.query("USE "+this.databasename+";");
    this.db.query("SELECT TABLE_NAME \
          FROM information_schema.TABLES \
          WHERE TABLE_SCHEMA =\""+this.databasename+"\";", function(err, rows, fields) {
        if (!err){
          var tableNames = rows;

          for (var i = 0; i < tableNames.length; i++){
            var name = tableNames[i].TABLE_NAME;
            var newTable = {
              "key": name,
              "name": name,
              "properties": [],
              "foreign_keys": [],
              "outgoing_links": [],
              "incoming_links": [],
              "primary_keys": [],
            }
            if (i == tableNames.length-1) // last one
              self.getTableProperties(newTable, res);
            else
              self.getTableProperties(newTable);
          }
        }
        else {
          console.log('Error while performing Query.');
          throw err;
        }
      } //end SELECT callback
    ); // end SELECT query
  } //end getTableSchema
  
  
  getTableProperties(newTable, res){
    var self = this;
    this.db.query("SELECT * \
                 FROM information_schema.COLUMNS \
                 WHERE TABLE_NAME = '" + newTable.name + "' \
                 AND TABLE_SCHEMA = '" + this.databasename + "';", function(err, rows, fields) {
          if (!err){
            for (var j = 0; j < rows.length; j++){
              newTable.properties.push({
                          name: rows[j].COLUMN_NAME,
                          type: rows[j].DATA_TYPE,
                          visibility: "public",
                        });
            }
            self.tables[newTable.name] = newTable;
            self.getTablePrimaryKeys(newTable.name, res);
          }
          else {
            console.log('Error while performing Query.');
            throw err;
          }
        } //end SELECT callback
    ); //end SELECT query
  } //end getTableProperties
  
  
  getTablePrimaryKeys(tableName, res) {
    var self = this;
    this.db.query("SELECT COLUMN_NAME \
                   FROM information_schema.KEY_COLUMN_USAGE \
                   WHERE TABLE_NAME = '" + tableName + "' AND CONSTRAINT_NAME = 'PRIMARY';",
                   function(err, rows, fields) {
                     if (!err) {
                        for (var i in rows) {
                          var primaryKeyName = rows[i].COLUMN_NAME;
                          self.tables[tableName].primary_keys.push(primaryKeyName);
                        }                      
                        if (res) {
                          self._resolveNames();
                          // for debugging //
                          //console.log("Primary Keys:");
                          for (var i in self.tables)
                          {
                            console.log(self.tables[i].key);
                            console.log(self.tables[i].primary_keys);
                          }
                          // end debugging //
                          self.getAllForeignKeys(res);
                        }
                     } else {
                       console.log("error: " + err);
                       throw err;
                     }
                   } // end SELECT callback
    ); //end SELECT query
  } // end getTablePrimaryKeys
  
  
  getAllForeignKeys(res) {
    var self = this;
    this.db.query("SELECT TABLE_NAME, REFERENCED_TABLE_NAME \
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
                self.abstractER(res);
              } else {
                console.log("error: " + err);
                throw err;
              }
            } //end SELECT callback
    ); //end SELECT query
  } //end getAllForeignKeys

  _resolveNames() {
    var self = this;
    for (var i in self.tables)
    {
      var table_primary_keys = self.tables[i].primary_keys;
      for (var j in table_primary_keys)
      {
        var curr_primary_key = table_primary_keys[j];
        
          // hardcode name modifications, since this step is based on the database
          // primary keys (algorithm says this step relies on documentation/knowledge
          // of the specific database)
        if (curr_primary_key == "id")
        {
          var name_to_append = self.tables[i].name;
          
          if (name_to_append.slice(-1) == 's' &&
              !(name_to_append.slice(-6) == "status")) {
            name_to_append = name_to_append.slice(0, -1);
          }
          
          table_primary_keys[j] = name_to_append + "_id";
        }
      }
    }
  }
  
  _pkCmp(a,b){
    for (var i = 0; i < a["primary_keys"].length; i++){
      var cmp = a["primary_keys"][i].localeCompare(b["primary_keys"][i]);
      if (cmp !== 0){
        return cmp;
      }
    return cmp;
    }
  }

  _pkIsShareSet(a,b){
    for (var i = 0; i < a["primary_keys"].length; i++){
      for (var j = 0; j < b["primary_keys"].length; j++){
        var cmp = a["primary_keys"][i].localeCompare(b["primary_keys"][j]);
        if (cmp == 0){
          return true;
        }
      }
    }
    return false;
  }

  orderAscPk(s){
    var self = this;
    s.sort(function (a, b) {
      if (a["primary_keys"].length < b["primary_keys"].length){
        return -1;
      }
      else if (a["primary_keys"].length > b["primary_keys"].length){
        return 1;
      }
      else {return self._pkCmp(a,b);
      }
    });  
  }

  abstractER(res){
    // Step 1 and 2
    var tableslist = [];
    for (var key in this.tables){
      tableslist.push(this.tables[key])
    }

    var disjoint = false;
    var remaining_rels = tableslist.slice();
    this.orderAscPk(tableslist)
    var ordered_rels = tableslist;
    var cluster = [];
    var nes = 0;
    var nas = 0;

    cluster.push(ordered_rels[0]);
    remaining_rels.shift();

    for (var i = 1; i < ordered_rels.length; i++){
      var R = ordered_rels[i];
      if (this._pkCmp(R, ordered_rels[i-1]) == 0){
        cluster[nes] = R;
        remaining_rels.filter(function (x) {x["key"] !== R["key"]});
      }
      else {
        disjoint = true;
        for (var s = 0; s < cluster.length; s++){
          if(this._pkIsShareSet(R, cluster[s])){
            disjoint = false;
          }
        }
        if (disjoint){
          nes++;
          cluster.push(R);
          remaining_rels.filter(function (x) {x["key"] !== R["key"]});
        }
      }
    }
    //console.log(cluster);

    res.send(null);
  }
} //end class Revenger

module.exports = {
  Revenger: Revenger
};