import 'server-only';

import { cache } from 'react';
import { getFullStandings } from './base-standings.service';

export const REQUEST_STANDINGS_POLICY = {
  access: 'public league statistics; no user identity',
  freshness: 'existing AppShell/Home request-local deduplication; no persistent cache',
} as const;

// One function identity for both AppShell and Home, preserving their shared read.
export const getRequestStandings = cache(async () => getFullStandings());
