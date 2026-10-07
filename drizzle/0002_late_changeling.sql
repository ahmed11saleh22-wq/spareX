CREATE TABLE `shipment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','preparing','shipped','in_transit','out_for_delivery','delivered','exception') NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`location` varchar(180),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingStatus` enum('pending','preparing','shipped','in_transit','out_for_delivery','delivered','exception') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `trackingNumber` varchar(120);--> statement-breakpoint
ALTER TABLE `orders` ADD `carrier` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `estimatedDelivery` varchar(120);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingUpdatedAt` timestamp;