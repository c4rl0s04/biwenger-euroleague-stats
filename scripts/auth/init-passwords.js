/**
 * Initial Auth Setup Script
 * Sets a default password for all managers in the database.
 * Usage: node scripts/auth/init-passwords.js
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import schema dynamically or define a minimal one for the script
// To avoid complex imports, we'll define the users table here
import { pgTable, text } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  password: text('password'),
});

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

  console.log('Connecting to database...');
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool);

  const defaultPassword = 'biwengerstats2026';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log(`Hashing password: "${defaultPassword}"`);

  try {
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} managers.`);

    for (const user of allUsers) {
      console.log(`Updating password for: ${user.name}...`);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));
    }

    console.log('✅ ALL PASSWORDS INITIALIZED SUCCESSFULLY.');
    console.log(`Default password for everyone: ${defaultPassword}`);
    console.log('Please tell your managers to change it in the Settings page once available.');
  } catch (error) {
    console.error('❌ Error initializing passwords:', error);
  } finally {
    await pool.end();
  }
}

main();
