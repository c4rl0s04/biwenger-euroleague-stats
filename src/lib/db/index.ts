import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { db as clientDb } from './client'; // Shared pool from legacy client

export const db = drizzle(clientDb as any, { schema });

// --- Exports from legacy index.js (Restored for backward compatibility) ---

export * from './queries/tournaments.js';
export * from './queries/core/users.js';
export * from './queries/core/players.js'; // Assuming players.js exists, step 605 said 'players' (no ext). I'll check dir.
export * from './queries/core/teams.js';   // Assuming teams.js exists

export * from './queries/competition/rounds';
export * from './queries/competition/matches';
export * from './queries/competition/schedule';
export * from './queries/competition/standings'; // This will resolve to standings.ts (the managed one)

export * from './queries/analytics/performance.js';
export * from './queries/analytics/advanced_stats.js';
export * from './queries/analytics/initial_squads.js';
export * from './queries/analytics/records.js';

export * from './queries/features/market.js';
export * from './queries/features/search.js';
export * from './queries/features/predictions.js';
