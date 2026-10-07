CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(40) NOT NULL,
	`userId` int,
	`customerName` varchar(180) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`shippingAddress` text NOT NULL,
	`subtotal` int NOT NULL,
	`shippingCost` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`status` enum('new','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` varchar(120) NOT NULL,
	`category` varchar(120) NOT NULL,
	`car` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`oldPrice` int,
	`stockQuantity` int NOT NULL DEFAULT 0,
	`imageUrl` varchar(500) NOT NULL,
	`badge` varchar(80),
	`rating` int NOT NULL DEFAULT 0,
	`status` enum('active','draft','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_fitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`make` varchar(100) NOT NULL,
	`model` varchar(120) NOT NULL,
	`yearFrom` int NOT NULL,
	`yearTo` int NOT NULL,
	`engine` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_fitments_id` PRIMARY KEY(`id`)
);
