import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, wallets, marketData, cryptocurrencies, orders, transactions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user's wallet for a specific cryptocurrency
 */
export async function getUserWallet(userId: number, cryptoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(wallets)
    .where((w) => and(eq(w.userId, userId), eq(w.cryptoId, cryptoId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(wallets).where(eq(wallets.userId, userId));
}

/**
 * Get market data for a cryptocurrency
 */
export async function getMarketData(cryptoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(marketData)
    .where(eq(marketData.cryptoId, cryptoId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active cryptocurrencies
 */
export async function getActiveCryptocurrencies() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cryptocurrencies)
    .where((c) => eq(c.isActive, 1));
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where((o) => eq(o.userId, userId))
    .orderBy((o) => o.createdAt)
    .limit(limit);
}

/**
 * Get user's transactions
 */
export async function getUserTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where((t) => eq(t.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}
