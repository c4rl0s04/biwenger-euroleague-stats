import 'server-only';
import { getPlayerFormMap } from '@/lib/db/queries/core/playerForm';

// The shared legacy form query remains the single implementation until its
// remaining analytics consumers migrate. No second form calculation is added.
export const readPlayerForm = getPlayerFormMap;
