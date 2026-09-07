import type { AllPlayAllEntry } from '../../models/all-play-all';
import type { AllPlayAllComputedRecord } from '../queries/all-play-all.records';

export function mapAllPlayAllEntry(row: AllPlayAllComputedRecord): AllPlayAllEntry {
  return {
    user_id: row.user_id,
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
    wins: row.wins,
    losses: row.losses,
    ties: row.ties,
    // JSON previously normalized NaN to null. Do this only after legacy sorting/cache.
    pct: Number.isFinite(row.pct) ? row.pct : null,
  };
}
