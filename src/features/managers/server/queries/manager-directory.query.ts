import 'server-only';
import { readManagerDirectory } from '@/lib/competition/server';
export type { ManagerDirectoryRow } from '@/lib/competition/server';

// Shared persistence projection avoids the existing Rounds -> Managers cycle.
// SQL, season resolution and ordering remain owned by that single query.
export const readManagerDirectoryRows = readManagerDirectory;
