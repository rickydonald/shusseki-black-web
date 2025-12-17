CREATE TABLE `XUsers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(80) NOT NULL,
	`username` varchar(191) NOT NULL,
	`password` varchar(191) NOT NULL,
	`role` enum('mod','notifier','x-user') NOT NULL DEFAULT 'mod',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` varchar(191) NOT NULL,
	`lastLogin` varchar(191) DEFAULT 'never',
	CONSTRAINT `XUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `XUsers_userId_unique` UNIQUE(`userId`)
);
