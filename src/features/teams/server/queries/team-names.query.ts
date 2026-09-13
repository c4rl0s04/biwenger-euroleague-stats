import 'server-only';
import { db } from '@/lib/db/connection';
import { teams } from '@/lib/db/schema';

/** Preserve the Playoffs lookup's unfiltered, unordered catalogue read. */
export async function readTeamNames() {
  return db.select().from(teams);
}
