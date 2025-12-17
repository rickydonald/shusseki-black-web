CREATE TABLE `DevicePushSubscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(80) NOT NULL,
	`deviceId` varchar(80) NOT NULL,
	`subscription` json NOT NULL,
	`createdAt` varchar(191) NOT NULL,
	`updatedAt` varchar(191) NOT NULL,
	CONSTRAINT `DevicePushSubscriptions_id` PRIMARY KEY(`id`)
);
