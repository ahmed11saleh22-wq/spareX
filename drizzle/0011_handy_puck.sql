CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`workshopId` int,
	`ledgerType` enum('wallet','credit') NOT NULL,
	`transactionType` varchar(80) NOT NULL,
	`amount` int NOT NULL DEFAULT 0,
	`walletBalanceAfter` int,
	`creditBalanceAfter` int,
	`creditLimitAfter` int,
	`description` varchar(255) NOT NULL,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_transactions_transactionNumber_unique` UNIQUE(`transactionNumber`)
);
--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_workshopId_workshops_id_fk` FOREIGN KEY (`workshopId`) REFERENCES `workshops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `wallet_transactions_user_idx` ON `wallet_transactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `wallet_transactions_workshop_idx` ON `wallet_transactions` (`workshopId`,`createdAt`);