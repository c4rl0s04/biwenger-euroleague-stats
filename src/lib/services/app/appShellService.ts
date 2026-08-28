import 'server-only';

import { cache } from 'react';

import { getExtendedStandings } from '@/lib/db/queries/competition/standings';

/** Deduplicates the standings read when the app shell and a screen need it in one request. */
export const getAppStandings = cache(async () => getExtendedStandings());
