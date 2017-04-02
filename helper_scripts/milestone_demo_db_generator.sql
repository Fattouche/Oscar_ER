DROP SCHEMA IF EXISTS `m3demo` ;
CREATE SCHEMA IF NOT EXISTS `m3demo`;
USE `m3demo`;

CREATE TABLE `advertising_initiative` (
  `project_name` varchar(20) NOT NULL,
  `country` varchar(20) NOT NULL,
  PRIMARY KEY (`project_name`,`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `assigned_computers` (
  `name` varchar(20) NOT NULL,
  `team` int(11) NOT NULL,
  `brand` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`name`,`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `project` (
  `project_name` varchar(20) NOT NULL,
  `country` varchar(20) NOT NULL,
  `deadline` int(11) NOT NULL,
  PRIMARY KEY (`project_name`,`country`,`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dev_ops` (
  `name` varchar(20) NOT NULL,
  `team` int(11) NOT NULL,
  PRIMARY KEY (`name`,`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `employees` (
  `name` varchar(20) NOT NULL,
  `position` varchar(20) NOT NULL,
  FOREIGN KEY (position)
	REFERENCES project(project_name),
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `hr_violators` (
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `internal_finish_dates` (
  `deadline` int(11) NOT NULL,
  PRIMARY KEY (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `intramural_players` (
  `name` varchar(20) NOT NULL,
  `sport` varchar(20) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `team_leads` (
  `name` varchar(20) NOT NULL,
  `team` int(11) NOT NULL,
  PRIMARY KEY (`name`,`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `teams` (
  `team` int(11) NOT NULL,
  `department` varchar(20) DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  PRIMARY KEY (`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `project_managers` (
  `name` varchar(20) NOT NULL,
  `team` int(11) NOT NULL,
  `partner` varchar(20) NOT NULL,
  `name_on_computer` varchar(20) NOT NULL,
  PRIMARY KEY (`name`,`team`),
  FOREIGN KEY (partner)
	REFERENCES team_leads(name),
  FOREIGN KEY (name_on_computer)
	REFERENCES assigned_computers(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;