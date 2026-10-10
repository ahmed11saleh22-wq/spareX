ALTER TABLE `workshops` MODIFY COLUMN `approvalStatus` enum('draft','pending','approved','rejected','suspended','requires_changes') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `workshops` ADD `workshopNameEn` varchar(180);--> statement-breakpoint
ALTER TABLE `workshops` ADD `managerName` varchar(180);--> statement-breakpoint
ALTER TABLE `workshops` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `workshops` ADD `whatsapp` varchar(40);--> statement-breakpoint
ALTER TABLE `workshops` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `workshops` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `workshops` ADD `district` varchar(120);--> statement-breakpoint
ALTER TABLE `workshops` ADD `mapUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `workshops` ADD `tradeLicenseNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `workshops` ADD `licenseExpiresAt` varchar(30);--> statement-breakpoint
ALTER TABLE `workshops` ADD `taxNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `workshops` ADD `branchCount` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `technicianCount` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `vehicleSpecialties` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `taxCertificate` varchar(500);--> statement-breakpoint
ALTER TABLE `workshops` ADD `storefrontImage` varchar(500);--> statement-breakpoint
ALTER TABLE `workshops` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `changeFields` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `internalNotes` text;--> statement-breakpoint
ALTER TABLE `workshops` ADD `reapplyAllowed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `workshops` ADD `workshopLevel` varchar(30);--> statement-breakpoint
ALTER TABLE `workshops` ADD `discountPercent` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `priceListId` varchar(80);--> statement-breakpoint
ALTER TABLE `workshops` ADD `minOrderAmount` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `creditLimit` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `paymentTermDays` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `creditAllowed` boolean DEFAULT false NOT NULL;