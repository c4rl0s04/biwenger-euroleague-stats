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
    list: 'private, no-store, max-age=0, must-revalidate',
    standings: 'private, no-store, max-age=0, must-revalidate',
    stats: 'private, no-store, max-age=0, must-revalidate',
    lineup: 'private, no-store, max-age=0, must-revalidate',
    leaderboard: 'private, no-store, max-age=0, must-revalidate',
    allHistory: 'private, no-store, max-age=0, must-revalidate',
    history: 'private, no-store, max-age=0, must-revalidate',
    lineupStats: 'no explicit Cache-Control; force-dynamic',
    errors: 'private, no-store, max-age=0, must-revalidate (lineup-stats has no explicit header)',
  },
} as const);
