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
--> statement-breakpoint
CREATE TABLE `InviteCodes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`generatedBy` varchar(191) NOT NULL,
	`code` varchar(191) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `InviteCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `InviteCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `UserFeedback` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`feedbackId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`feedbackType` enum('bug','feature','problem','suggestion','others') NOT NULL DEFAULT 'others',
	`feedback` varchar(500) NOT NULL,
	`isReplied` boolean NOT NULL DEFAULT false,
	`reply` varchar(500),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` varchar(191) NOT NULL,
	`subject` varchar(191) NOT NULL,
	`errorCode` varchar(191),
	CONSTRAINT `UserFeedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `UserFeedback_feedbackId_unique` UNIQUE(`feedbackId`)
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(191) NOT NULL,
	`name` varchar(191) DEFAULT 'Guest',
	`shift` int DEFAULT 0,
	`isBanned` boolean NOT NULL DEFAULT false,
	`inviteCode` varchar(191),
	`userType` enum('user','x-user') NOT NULL DEFAULT 'user',
	`createdAt` timestamp DEFAULT (now()),
	`createdAtServer` varchar(191),
	`lastLogin` varchar(191) DEFAULT 'start',
	CONSTRAINT `Users_id` PRIMARY KEY(`id`),
	CONSTRAINT `Users_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `XUsers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shussekiXUserId` varchar(191) NOT NULL,
	`userId` varchar(80) NOT NULL,
	`username` varchar(191) NOT NULL,
	`password` varchar(191) NOT NULL,
	`role` enum('mod','notifier','x-user') NOT NULL DEFAULT 'mod',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` varchar(191) NOT NULL,
	`lastLogin` varchar(191) DEFAULT 'never',
	CONSTRAINT `XUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `XUsers_shussekiXUserId_unique` UNIQUE(`shussekiXUserId`),
	CONSTRAINT `XUsers_userId_unique` UNIQUE(`userId`)
);
