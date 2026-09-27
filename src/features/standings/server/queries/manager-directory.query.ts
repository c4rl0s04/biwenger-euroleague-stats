import 'server-only';
import { readManagerDirectory } from '@/lib/competition/server';

// Shared fantasy directory avoids a Managers -> Standings -> Managers cycle.
export const queryStandingsManagers = readManagerDirectory;
