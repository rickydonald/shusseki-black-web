CREATE TABLE `UserFeedback` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`feedbackId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`feedbackType` enum('bug','feature','problem','suggestion','others') NOT NULL DEFAULT 'others',
	`feedback` varchar(191) NOT NULL,
	`isReplied` boolean NOT NULL DEFAULT false,
	`reply` varchar(191),
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
	`dobHash` varchar(191) NOT NULL,
	`isBanned` boolean NOT NULL DEFAULT false,
	`userType` enum('user','x-admin-user') NOT NULL DEFAULT 'user',
	`createdAt` timestamp DEFAULT (now()),
	`createdAtServer` varchar(191),
	`lastLogin` varchar(191) DEFAULT 'start',
	CONSTRAINT `Users_id` PRIMARY KEY(`id`),
	CONSTRAINT `Users_userId_unique` UNIQUE(`userId`)
);
