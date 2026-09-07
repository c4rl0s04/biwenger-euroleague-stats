import type { ManagerProfileDisplayRow } from '../../models/manager-profile';
import type { ManagerTournamentParticipation } from '@/features/tournaments/public';

/** The legacy phase translator can return an inherited function or prototype for
 * malformed prototype-key input. These already fail the desktop RSC boundary. Fail
 * before returning props instead of leaking non-serializable values to a screen;
 * do not coerce malformed data into a valid phase or alter the mobile projection. */
export function mapManagerProfileTournaments(
  rows: ManagerTournamentParticipation[]
): ManagerTournamentParticipation[] {
  return rows.map((row) => {
    if (
      typeof row.phase_name === 'function' ||
      typeof row.phase_name === 'symbol' ||
      typeof row.phase_name === 'bigint' ||
      (row.phase_name !== null &&
        typeof row.phase_name === 'object' &&
        !Array.isArray(row.phase_name) &&
        Object.getPrototypeOf(row.phase_name) !== Object.prototype)
    ) {
      throw new TypeError('Manager tournament phase is not serializable');
    }
    return {
      tournament_id: row.tournament_id,
      tournament_name: row.tournament_name,
      tournament_type: row.tournament_type,
      tournament_status: row.tournament_status,
      position: row.position,
      points: row.points,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      phase_name: row.phase_name,
      group_name: row.group_name,
    };
  });
}

const TITLE_KEYS = ['name', 'player_name', 'user_name', 'round_name', 'title', 'comprador'];
const SUBTITLE_KEYS = ['team', 'player_team', 'description', 'vendedor', 'label', 'position'];
const VALUE_KEYS = [
  'points',
  'total_points',
  'avg_points',
  'score',
  'wins',
  'count',
  'precio',
  'price',
  'profit',
  'total_spent',
];
const first = (row: Record<string, unknown>, keys: string[]) =>
  keys.map((key) => row[key]).find((value) => value !== undefined && value !== null);

/** Preserve the existing mobile list's first-array, first-20 projection, including
 * season transfers and squad risers. This migration does not redesign those views. */
export function mapManagerProfileRows(
  value: unknown,
  linkPrefix?: string
): ManagerProfileDisplayRow[] {
  let records: unknown[];
  if (Array.isArray(value)) records = value;
  else if (value && typeof value === 'object') {
    const nested = Object.values(value).find(Array.isArray);
    records = nested ?? [value];
  } else records = [];
  return records
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .slice(0, 20)
    .map((row, index) => {
      const title = first(row, TITLE_KEYS) ?? `Registro ${index + 1}`;
      const subtitle = first(row, SUBTITLE_KEYS);
      const value = first(row, VALUE_KEYS);
      const id = row.player_id ?? row.user_id ?? row.id;
      return {
        key: String(id ?? index),
        index: index + 1,
        title: String(title),
        ...(subtitle != null ? { subtitle: String(subtitle) } : {}),
        ...(value != null ? { value: Number(value).toLocaleString('es-ES') } : {}),
        ...(linkPrefix && id != null ? { href: `${linkPrefix}/${id}` } : {}),
      };
    });
}
