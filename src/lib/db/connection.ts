import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { db as clientDb } from './client';

// One shared connection, independent of the legacy query export barrel.
export const db = drizzle(clientDb as any, { schema });
export const pgClient = clientDb;
