import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cryptocurrencies supported on the exchange
 */
export const cryptocurrencies = mysqlTable("cryptocurrencies", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull().unique(), // BTC, ETH, etc.
  name: varchar("name", { length: 100 }).notNull(), // Bitcoin, Ethereum
  coinGeckoId: varchar("coinGeckoId", { length: 100 }).notNull().unique(), // For API integration
  logo: text("logo"), // URL to logo
  description: text("description"),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cryptocurrency = typeof cryptocurrencies.$inferSelect;
export type InsertCryptocurrency = typeof cryptocurrencies.$inferInsert;

/**
 * User wallets for holding cryptocurrencies
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cryptoId: int("cryptoId").notNull(),
  balance: varchar("balance", { length: 100 }).default("0").notNull(), // Store as string to handle large numbers
  lockedBalance: varchar("lockedBalance", { length: 100 }).default("0").notNull(), // For pending orders
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Real-time market prices (cached from external API)
 */
export const marketData = mysqlTable("marketData", {
  id: int("id").autoincrement().primaryKey(),
  cryptoId: int("cryptoId").notNull(),
  priceUsd: varchar("priceUsd", { length: 100 }).notNull(),
  priceEur: varchar("priceEur", { length: 100 }),
  marketCap: varchar("marketCap", { length: 100 }),
  volume24h: varchar("volume24h", { length: 100 }),
  percentChange24h: varchar("percentChange24h", { length: 50 }),
  percentChange7d: varchar("percentChange7d", { length: 50 }),
  highPrice24h: varchar("highPrice24h", { length: 100 }),
  lowPrice24h: varchar("lowPrice24h", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

/**
 * Trading orders (buy/sell)
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cryptoId: int("cryptoId").notNull(),
  orderType: mysqlEnum("orderType", ["buy", "sell"]).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  pricePerUnit: varchar("pricePerUnit", { length: 100 }).notNull(),
  totalPrice: varchar("totalPrice", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "filled", "partial", "cancelled"]).default("pending").notNull(),
  filledQuantity: varchar("filledQuantity", { length: 100 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Transaction history (deposits, withdrawals, trades)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromCryptoId: int("fromCryptoId"),
  toCryptoId: int("toCryptoId"),
  transactionType: mysqlEnum("transactionType", ["deposit", "withdrawal", "trade", "transfer"]).notNull(),
  amount: varchar("amount", { length: 100 }).notNull(),
  fee: varchar("fee", { length: 100 }).default("0"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  orderId: int("orderId"), // Reference to order if transaction is from a trade
  txHash: varchar("txHash", { length: 255 }), // For blockchain transactions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * User portfolio snapshots for analytics
 */
export const portfolioSnapshots = mysqlTable("portfolioSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalValueUsd: varchar("totalValueUsd", { length: 100 }).notNull(),
  totalValueEur: varchar("totalValueEur", { length: 100 }),
  holdingsJson: text("holdingsJson"), // JSON array of holdings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;