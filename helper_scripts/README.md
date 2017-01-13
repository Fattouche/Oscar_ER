**Test Database Generator**
To generate a new test database, start your MySQL server (`mysqld`), then navigate to 
the helper_scripts folder and start your MySQL client (`mysql -u [username] -p[password]`). 

In MySQL, type `source test_db_generator.sql;`. Note that this will delete any existing
`oscar_test` database that exists on your MySQL server, and recreate it.

To test that it worked, execute `show tables;` - you should be located in the oscar_test
database already, and the tables in the test database should be shown.