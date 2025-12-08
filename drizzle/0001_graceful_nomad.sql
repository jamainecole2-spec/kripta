CREATE TABLE `cryptocurrencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`coinGeckoId` varchar(100) NOT NULL,
	`logo` text,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cryptocurrencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `cryptocurrencies_symbol_unique` UNIQUE(`symbol`),
	CONSTRAINT `cryptocurrencies_coinGeckoId_unique` UNIQUE(`coinGeckoId`)
);
--> statement-breakpoint
CREATE TABLE `marketData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cryptoId` int NOT NULL,
	`priceUsd` varchar(100) NOT NULL,
	`priceEur` varchar(100),
	`marketCap` varchar(100),
	`volume24h` varchar(100),
	`percentChange24h` varchar(50),
	`percentChange7d` varchar(50),
	`highPrice24h` varchar(100),
	`lowPrice24h` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cryptoId` int NOT NULL,
	`orderType` enum('buy','sell') NOT NULL,
	`quantity` varchar(100) NOT NULL,
	`pricePerUnit` varchar(100) NOT NULL,
	`totalPrice` varchar(100) NOT NULL,
	`status` enum('pending','filled','partial','cancelled') NOT NULL DEFAULT 'pending',
	`filledQuantity` varchar(100) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`cancelledAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalValueUsd` varchar(100) NOT NULL,
	`totalValueEur` varchar(100),
	`holdingsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromCryptoId` int,
	`toCryptoId` int,
	`transactionType` enum('deposit','withdrawal','trade','transfer') NOT NULL,
	`amount` varchar(100) NOT NULL,
	`fee` varchar(100) DEFAULT '0',
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`orderId` int,
	`txHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cryptoId` int NOT NULL,
	`balance` varchar(100) NOT NULL DEFAULT '0',
	`lockedBalance` varchar(100) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
