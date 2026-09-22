import 'server-only';

export const HOME_READ_POLICY = {
  activity: {
    access: 'authenticated league activity; session checked by page/HTTP adapter',
    identity: 'no client-selected user; league-wide feed',
    serverCache: 'none',
    httpCache: 'private, no-store',
    browserCache: 'existing per-mounted-feed, per-filter in-memory snapshots only',
  },
  summary: {
    access: 'trusted session user ID from the server page; no public HTTP endpoint',
    serverCache: 'none; only standings dependency uses shared request-local React deduplication',
  },
  landing: {
    access: 'public aggregate statistics; identity-independent',
    serverCache: 'none',
    httpCache: 'public, max-age=300, stale-while-revalidate=60',
    errorCache: 'private, no-store, max-age=0, must-revalidate',
  },
} as const;
