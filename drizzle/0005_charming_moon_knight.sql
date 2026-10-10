CREATE TABLE `auth_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` varchar(255),
	`ipAddress` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `registration_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(80) NOT NULL,
	`accountType` enum('customer','workshop') NOT NULL,
	`phone` varchar(40) NOT NULL,
	`payload` text NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `registration_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `registration_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`make` varchar(100) NOT NULL,
	`model` varchar(120) NOT NULL,
	`year` int NOT NULL,
	`trim` varchar(120),
	`vin` varchar(17),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `workshops` MODIFY COLUMN `approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `workshops` ADD `specialties` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `warehouseDetails` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `warehouseCount` int DEFAULT 0 NOT NULL;