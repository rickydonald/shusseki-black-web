ALTER TABLE `XUsers` ADD `shussekiXUserId` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `XUsers` ADD CONSTRAINT `XUsers_shussekiXUserId_unique` UNIQUE(`shussekiXUserId`);