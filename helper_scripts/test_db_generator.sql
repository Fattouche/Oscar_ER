DROP DATABASE IF EXISTS oscar_test;
CREATE DATABASE oscar_test;
use oscar_test;
CREATE TABLE teamMembers (firstname VARCHAR(20) PRIMARY KEY, lastname VARCHAR(20), age INT, charisma INT);