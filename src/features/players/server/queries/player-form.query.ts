import 'server-only';
import { getPlayerFormMap } from '@/lib/competition/server';

// Shared season-scoped competition projection; no additional caching.
export const readPlayerForm = getPlayerFormMap;
