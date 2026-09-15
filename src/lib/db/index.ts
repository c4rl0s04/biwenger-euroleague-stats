// Canonical connection exports from client.ts
export { db, pool, pool as pgClient } from './client';

// --- Domain query exports remain for backward compatibility until feature architecture migration is completed ---

export * from './queries/tournaments';
export * from './queries/core/users';

export * from './queries/core/playerForm';
export * from './queries/core/teams';

export * from './queries/competition/rounds';
export * from './queries/competition/matches';
export * from './queries/competition/schedule';
export * from './queries/competition/standings';

export * from './queries/analytics/performance';
export * from './queries/analytics/advanced_stats';
export * from './queries/analytics/initial_squads';
export * from './queries/analytics/records';
export * from './queries/analytics/season-review';

export * from './queries/features/market';
export * from './queries/features/search';
export * from './queries/features/predictions';
