ALTER TABLE `orders` ADD `paymentStatus` enum('pending','paid','failed','refunded','cancelled') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(40);--> statement-breakpoint
ALTER TABLE `orders` ADD `moyasarPaymentId` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_moyasarPaymentId_unique` UNIQUE(`moyasarPaymentId`);