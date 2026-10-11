CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifierHash` varchar(128) NOT NULL,
	`ipAddress` varchar(80),
	`success` boolean NOT NULL DEFAULT false,
	`reason` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(80) NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('phone','email') NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastSentAt` timestamp NOT NULL DEFAULT (now()),
	`attempts` int NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
--> statement-breakpoint
CREATE TABLE `user_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` enum('terms_privacy','marketing') NOT NULL,
	`accepted` boolean NOT NULL,
	`policyVersion` varchar(40) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`userId` int NOT NULL,
	`permissions` text NOT NULL,
	`status` enum('invited','active','disabled') NOT NULL DEFAULT 'invited',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workshop_employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','super_admin','workshop_owner','workshop_employee') NOT NULL DEFAULT 'user';