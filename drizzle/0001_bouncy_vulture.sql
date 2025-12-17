CREATE TABLE `ClassTimetables` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(80) NOT NULL,
	`classCode` varchar(80) NOT NULL,
	`timetable` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` varchar(191) NOT NULL,
	CONSTRAINT `ClassTimetables_id` PRIMARY KEY(`id`)
);
