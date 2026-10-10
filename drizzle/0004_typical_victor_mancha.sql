CREATE TABLE `workshops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workshopName` varchar(180) NOT NULL,
	`city` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`businessType` varchar(100) NOT NULL,
	`monthlyVolume` varchar(80) NOT NULL,
	`tradeLicense` varchar(500),
	`logo` varchar(500),
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workshops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `accountType` enum('customer','workshop') DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','pending','suspended') DEFAULT 'active' NOT NULL;