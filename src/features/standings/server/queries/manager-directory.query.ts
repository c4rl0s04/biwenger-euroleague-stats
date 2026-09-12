import 'server-only';
import { readManagerDirectory } from '@/lib/db/queries/core/manager-directory';

// Shared fantasy directory avoids a Managers -> Standings -> Managers cycle.
export const queryStandingsManagers = readManagerDirectory;
