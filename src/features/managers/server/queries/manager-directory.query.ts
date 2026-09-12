import 'server-only';
import { readManagerDirectory } from '@/lib/db/queries/core/manager-directory';
export type { ManagerDirectoryRow } from '@/lib/db/queries/core/manager-directory';

// Shared persistence projection avoids the existing Rounds -> Managers cycle.
// SQL, season resolution and ordering remain owned by that single query.
export const readManagerDirectoryRows = readManagerDirectory;
