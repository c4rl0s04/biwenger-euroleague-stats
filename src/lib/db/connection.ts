/**
 * Compatibility re-exports only. The canonical runtime entrypoint is './client'.
 * TEMPORARY — REMOVE DURING FEATURE ARCHITECTURE MIGRATION
 */
export { db, pool, pool as pgClient } from './client';
