CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`oldValues` text,
	`newValues` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userIdentifier` varchar(320) NOT NULL,
	`purpose` varchar(60) NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`documentType` varchar(80) NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSize` int NOT NULL,
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','employee') NOT NULL DEFAULT 'employee',
	`permissions` text NOT NULL,
	`status` enum('invited','active','disabled') NOT NULL DEFAULT 'invited',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_member_unique` UNIQUE(`workshopId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workshop_pricing_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`pricingLevel` enum('Bronze','Silver','Gold','Platinum') NOT NULL,
	`discountPercentage` int NOT NULL DEFAULT 0,
	`minimumOrder` int NOT NULL DEFAULT 0,
	`creditEnabled` boolean NOT NULL DEFAULT false,
	`creditLimit` int NOT NULL DEFAULT 0,
	`paymentTermsDays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workshop_pricing_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_pricing_workshop_unique` UNIQUE(`workshopId`)
);
--> statement-breakpoint
CREATE TABLE `workshop_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`serviceType` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_service_unique` UNIQUE(`workshopId`,`serviceType`)
);
--> statement-breakpoint
CREATE TABLE `workshop_specializations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshopId` int NOT NULL,
	`specialization` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_specializations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_specialization_unique` UNIQUE(`workshopId`,`specialization`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phoneCountryCode` varchar(8);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `marketingConsent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `workshops` ADD `ownerUserId` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `otp_codes_lookup_idx` ON `otp_codes` (`userIdentifier`,`purpose`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workshop_documents_workshop_idx` ON `workshop_documents` (`workshopId`);--> statement-breakpoint
CREATE INDEX `workshop_documents_type_idx` ON `workshop_documents` (`documentType`);--> statement-breakpoint
CREATE INDEX `workshop_members_workshop_idx` ON `workshop_members` (`workshopId`);--> statement-breakpoint
CREATE INDEX `workshop_services_workshop_idx` ON `workshop_services` (`workshopId`);--> statement-breakpoint
CREATE INDEX `workshop_specializations_workshop_idx` ON `workshop_specializations` (`workshopId`);--> statement-breakpoint
CREATE INDEX `workshops_owner_idx` ON `workshops` (`userId`);--> statement-breakpoint
CREATE INDEX `workshops_status_idx` ON `workshops` (`approvalStatus`);--> statement-breakpoint
CREATE INDEX `workshops_phone_idx` ON `workshops` (`phone`);