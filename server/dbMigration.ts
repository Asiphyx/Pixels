import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations for schema updates
 */
export async function runMigrations() {
  console.log('[migration] Starting database migrations...');
  try {
    // Add email column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS silver INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0
    `);
    console.log('[migration] Updated users table');

    // Create items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL DEFAULT 'common',
        value INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        stackable BOOLEAN DEFAULT FALSE,
        max_stack INTEGER DEFAULT 1,
        icon TEXT NOT NULL DEFAULT 'default_item',
        stats JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[migration] Created items table');

    // Create user_inventory table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        equipped BOOLEAN DEFAULT FALSE,
        equip_slot TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[migration] Created user_inventory table');

    console.log('[migration] Successfully completed all migrations');
  } catch (error) {
    console.error('[migration] Error running migrations:', error);
    throw error;
  }
}