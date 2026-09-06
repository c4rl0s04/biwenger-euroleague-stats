import 'server-only';

import { resolveReadSeasonId } from '@/lib/db/season-context';

/** Season resolution includes a database existence check; keep it in the query layer. */
export async function resolveCalendarSeasonId(): Promise<string> {
  return resolveReadSeasonId();
}
