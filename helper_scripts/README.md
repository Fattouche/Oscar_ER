**Test Database Generator**
To generate a new test database, start your MySQL server (`mysqld`), then navigate to 
the helper_scripts folder and start your MySQL client (`mysql -u [username] -p[password]`). 

In MySQL, type `source test_db_generator.sql;`. Note that this will delete the existing
`oscar_test` database that exists on your MySQL server, and recreate it.

Instructions are the same for `northwind_test_db_generator.sql`