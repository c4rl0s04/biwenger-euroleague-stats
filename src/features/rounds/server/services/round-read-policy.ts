/** Existing public fantasy results, selected by URL IDs, never session fallback.
 * These are league-visible statistical lineups, not private provider operations.
 * All database reads remain uncached. Routes preserve independent existing headers.
 */
export const ROUNDS_READ_POLICY = Object.freeze({
  access: 'public fantasy results and manager directory; no session fallback',
  identity: 'explicit caller/URL IDs, passed through unchanged',
  serverCache: 'none',
  mutations: 'none',
  http: {
    list: 'public, max-age=900, stale-while-revalidate=60',
    standings: 'public, max-age=60, stale-while-revalidate=60',
    stats: 'public, max-age=300, stale-while-revalidate=60',
    lineup: 'public, max-age=300, stale-while-revalidate=60',
    leaderboard: 'public, max-age=300, stale-while-revalidate=60',
    allHistory: 'public, max-age=300, stale-while-revalidate=60',
    history: 'public, max-age=0, stale-while-revalidate=60',
    lineupStats: 'no explicit Cache-Control; force-dynamic',
    errors: 'private, no-store, max-age=0, must-revalidate (lineup-stats has no explicit header)',
  },
} as const);
