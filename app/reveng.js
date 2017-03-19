"use strict"
class Revenger {

    constructor(res, mysql, host, port, user, password, database, source) {
        this.db = mysql.createConnection({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database
        });
        this.source = source;
        this.databasename = database;
        this.links = [];
        this.tables = {};
        this.abstractEREntities = {};
        this.abstractERRelationships = {};
        this.abstractERLinks = [];
        this._cluster;
        this._argument;
        this._numAE;
        this._numAR;
        this.data = null;
        this.db.connect(function(err) {
            if (err) {
                res.json({
                    connect: false,
                    message: "MySQL connection failed"
                });
            } else {
                res.json({
                    connect: true
                });
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

    parseAbstractERData() {
        for (var i = 0; i < this._cluster.length; i++) {
            if (i < this._numAE) {
                var tag = "AE " + (i + 1);
            } else {
                var tag = "AR " + ((i - this._numAE) + 1);
            }
            if (this._cluster[i].length > 0) {
                var newtable = {
                    key: tag,
                    name: tag,
                    properties: []
                }
                for (var j = 0; j < this._cluster[i].length; j++) {
                    newtable.properties.push({
                        name: this._cluster[i][j].name,
                        type: "Table",
                        visibility: "public"
                    });
                }
                if (i < this._numAE) {
                  this.abstractEREntities[tag] = newtable;
                } else {
                  this.abstractERRelationships[tag] = newtable;
                }
            }

        }
        for (var i = 0; i < this._numAR; i++) {
            for (var j = 0; j < this._argument[i].length; j++) {
                if (this._argument[i][j]) {
                    this.abstractERLinks.push({
                        from: "AE " + (j + 1),
                        to: "AR " + (i + 1),
                        relationship: "generalization"
                    });
                }
            }
        }
    }

    getData(res) {
        res.json({
            aEntities: this.abstractEREntities,
            aRelationships: this.abstractERRelationships,
            aLinks: this.abstractERLinks,
            tables: this.tables,
            links: this.links,
            database: this.databasename,
            data: this.data
        })
    } //end getData


    getTableSchema(res) {
        var self = this;
        self.tables = {};
        self.links = [];
        //Call to java program
        this.db.query("USE " + this.databasename + ";");
        this.db.query("SELECT TABLE_NAME \
          FROM information_schema.TABLES \
          WHERE TABLE_SCHEMA =\"" + this.databasename + "\";", function(err, rows, fields) {
                if (!err) {
                    var tableNames = rows;

                    for (var i = 0; i < tableNames.length; i++) {
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
                        if (i == tableNames.length - 1) // last one
                            self.getTableProperties(newTable, res);
                        else
                            self.getTableProperties(newTable);
                    }
                } else {
                    console.log('Error while performing Query.');
                    throw err;
                }
            } //end SELECT callback
        ); // end SELECT query
    } //end getTableSchema


    getTableProperties(newTable, res) {
        var self = this;
        this.db.query("SELECT * \
                 FROM information_schema.COLUMNS \
                 WHERE TABLE_NAME = '" + newTable.name + "' \
                 AND TABLE_SCHEMA = '" + this.databasename + "';", function(err, rows, fields) {
                if (!err) {
                    for (var j = 0; j < rows.length; j++) {
                        newTable.properties.push({
                            name: rows[j].COLUMN_NAME,
                            type: rows[j].DATA_TYPE,
                            visibility: "public",
                        });
                    }
                    self.tables[newTable.name] = newTable;
                    self.getTablePrimaryKeys(newTable.name, res);
                } else {
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
                        // for debugging //
                        //console.log("Primary Keys:");
                        for (var i in self.tables) {
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
                        self.links.push({
                            "from": fromName,
                            "to": toName
                        });
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

    /*
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
    */

    _pkCmp(a, b) {
        var aLength = a["primary_keys"].length;
        var bLength = b["primary_keys"].length;

        if (aLength < bLength) {
            return -1;
        } else if (bLength < aLength) {
            return 1;
        }

        for (var i = 0; i < a["primary_keys"].length; i++) {
            var cmp = a["primary_keys"][i].localeCompare(b["primary_keys"][i]);
            if (cmp !== 0) {
                return cmp;
            }
        }

        return 0;
    }

    _anyPKsSharedWithRelation(a, b) {
        for (var i = 0; i < a["primary_keys"].length; i++) {
            for (var j = 0; j < b["primary_keys"].length; j++) {
                var cmp = a["primary_keys"][i].localeCompare(b["primary_keys"][j]);
                if (cmp == 0) {
                    return true;
                }
            }
        }
        return false;
    }

    _anyPKsSharedWithAbstractEntity(relation, entity) {
        for (var i in entity) {
            if (this._anyPKsSharedWithRelation(relation, entity[i]) === true) {
                return true;
            }
        }
        return false;
    }

    orderAscPk(s) {
        var self = this;
        s.sort(function(a, b) {
            return self._pkCmp(a, b)
        });
    }

    abstractER(res) {
        // Step 1 and 2
        var tableslist = [];
        for (var i in this.tables) {
            tableslist.push(this.tables[i])
        }

        var disjoint = false;
        this.orderAscPk(tableslist)
        var ordered_rels = tableslist;
        var remainingRels = ordered_rels.slice();

        // FOR DEBUGGING //
        /*
        console.log();
        console.log("tableslist:");
        for (var i in tableslist) {
            console.log("{ " + tableslist[i].name + ", [" + tableslist[i].primary_keys + "] }")
        }
        */
        // END DEBUGGING //

        var cluster = [];
        for (var i in tableslist) {
            cluster.push([]);
        }

        cluster[0].push(ordered_rels[0]);
        var numAbstractEntities = 1;
        remainingRels.shift();

        for (var i = 1; i < ordered_rels.length; i++) {
            var relation = ordered_rels[i];
            if (this._pkCmp(relation, cluster[numAbstractEntities - 1][0]) === 0) {
                cluster[numAbstractEntities - 1].push(relation);
                remainingRels = remainingRels.filter(function(x) {
                    return x.name !== relation.name
                });
            } else {
                disjoint = true;
                for (var s = 0; s < numAbstractEntities; s++) {
                    if (this._anyPKsSharedWithAbstractEntity(relation, cluster[s])) {
                        disjoint = false;
                    }
                }
                if (disjoint) {
                    cluster[numAbstractEntities].push(relation);
                    numAbstractEntities++;
                    remainingRels = remainingRels.filter(function(x) {
                        return x.name !== relation.name
                    });
                }
            }
        }

        // FOR DEBUGGING //
        /*
        console.log();
        console.log("cluster: ");
        for (var i in cluster) {
            var string = "[ ";
            for (var j in cluster[i]) {
                string = string + cluster[i][j].name + ", ";
            }
            string = string + "]";
            console.log(string);
        }
        console.log("remainingRels: ");
        var string = "[ ";
        for (var i in remainingRels) {
            string = string + remainingRels[i].name + ", ";
        }
        string = string + "]";
        console.log(string);
        */
        // END DEBUGGING //

        // Step 3    
        for (var r = 0; r < remainingRels.length; r++) {
            var relation = remainingRels[r];

            // This looks a little different than the pseudocode, but does the same thing
            // while only needing to iterate over each cluster once
            var i = 0;
            var isAbstractRelation = false;
            var foundCluster = -1;

            while (i < numAbstractEntities && !isAbstractRelation) {
                if (this._anyPKsSharedWithAbstractEntity(relation, cluster[i])) {
                    if (foundCluster === -1) {
                        foundCluster = i;
                    } else {
                        // then the primary keys in relation are found in multiple abstract entities
                        isAbstractRelation = true;
                    }
                }
                i++;
            }

            if (!isAbstractRelation) {
                cluster[foundCluster].push(relation);
                remainingRels = remainingRels.filter(function(x) {
                    return x.name !== relation.name
                });
                r--;
            }
        }

        // FOR DEBUGGING //
        /*
        console.log();
        console.log("cluster: ");
        for (var i in cluster) {
            var string = "[ ";
            for (var j in cluster[i]) {
                string = string + cluster[i][j].name + ", ";
            }
            string = string + "]";
            console.log(string);
        }
        console.log("remainingRels: ");
        var string = "[ ";
        for (var i in remainingRels) {
            string = string + remainingRels[i].name + ", ";
        }
        string = string + "]";
        console.log(string);
        */
        // END DEBUGGING //

        // Step 4    
        var argument = [];
        var intersects = [];
        var numAbstractRelationships = 0;
        for (var i = 0; i < tableslist.length; i++) {
            argument.push([]);
            for (var j = 0; j < numAbstractEntities; j++) {
                argument[i].push(false);
                if (i === 0) {
                    intersects.push(false);
                }
            }
        }
        var firstRelationship = true;

        for (var r = 0; r < remainingRels.length; r++) {
          
            // reset intersects array
            for (var i in intersects) {
              intersects[i] = false;
            }
            
            var relation = remainingRels[r];

            for (var i = 0; i < numAbstractEntities; i++) {
                if (this._anyPKsSharedWithAbstractEntity(relation, cluster[i])) {
                    intersects[i] = true;
                }
            }

            if (firstRelationship === true) {
                for (var i = 0; i < numAbstractEntities; i++) {
                    argument[0][i] = intersects[i];
                }
                cluster[numAbstractEntities + numAbstractRelationships].push(relation);
                numAbstractRelationships++;
                remainingRels = remainingRels.filter(function(x) {
                    return x.name !== relation.name
                });
                r--;
                firstRelationship = false;
            } else {
                var j = 0;
                var found = false;

                while (j < numAbstractRelationships && !found) {
                    var inRelationship = true;

                    for (var i in intersects) {
                        if (intersects[i] !== argument[j][i]) {
                            inRelationship = false;
                            break;
                        }
                    }

                    if (inRelationship) {
                        cluster[numAbstractEntities + j].push(relation);
                        remainingRels = remainingRels.filter(function(x) {
                            return x.name !== relation.name
                        });
                        r--;
                        found = true;
                    }
                    j++;

                }

                if (!found) {
                    for (var i = 0; i < numAbstractEntities; i++) {
                        argument[numAbstractRelationships][i] = intersects[i];
                    }
                    cluster[numAbstractEntities + numAbstractRelationships].push(relation);
                    numAbstractRelationships++;
                    remainingRels = remainingRels.filter(function(x) {
                        return x.name !== relation.name
                    });
                    r--;
                }
            }
        }

        // FOR DEBUGGING //
        console.log();
        console.log("END OF ALGORITHM:");
        console.log("cluster: ");
        for (var i in cluster) {
            var string = "[ ";
            for (var j in cluster[i]) {
                string = string + cluster[i][j].name + ", ";
            }
            string = string + "]";
            console.log(string);
        }
        console.log(argument);
        console.log("numAbstractEntities: " + numAbstractEntities);
        console.log("numAbstractRelationships: " + numAbstractRelationships);
        console.log("remainingRels: ");
        var string = "[ ";
        for (var i in remainingRels) {
            string = string + remainingRels[i].name + ", ";
        }
        string = string + "]";
        console.log(string);
        // END DEBUGGING //

        this._cluster = cluster;
        this._argument = argument;
        this._numAE = numAbstractEntities;
        this._numAR = numAbstractRelationships;
        this.parseAbstractERData();

        res.send(null);
    }
} //end class Revenger

module.exports = {
    Revenger: Revenger
};