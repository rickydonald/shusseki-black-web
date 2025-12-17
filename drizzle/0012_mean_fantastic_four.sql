CREATE TABLE `PushNotificationHistory` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`notificationId` varchar(191) NOT NULL,
	`userId` varchar(80),
	`targetType` enum('single','multiple','broadcast') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` varchar(500) NOT NULL,
	`icon` varchar(255),
	`badge` varchar(255),
	`data` json,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`sentBy` varchar(80),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `PushNotificationHistory_id` PRIMARY KEY(`id`),
	CONSTRAINT `PushNotificationHistory_notificationId_unique` UNIQUE(`notificationId`)
);
