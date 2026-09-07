import type { RoundDisplayRow, RoundOverviewViewModel } from '../../models/round-screen';
import type { RoundCompleteViewModel, RoundsListViewModel } from '../../models/round-read';

const titles = ['name', 'player_name', 'user_name', 'round_name', 'title', 'comprador'];
const subtitles = ['team', 'player_team', 'description', 'vendedor', 'label', 'position'];
const values = [
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

/** Exact legacy mobile first-array/first-20 display projection, not a new API model. */
export function mapRoundRows(value: unknown, linkPrefix?: string): RoundDisplayRow[] {
  const records = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (Object.values(value).find(Array.isArray) ?? [value])
      : [];
  return records
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .slice(0, 20)
    .map((row, index) => {
      const title = first(row, titles) ?? `Registro ${index + 1}`;
      const subtitle = first(row, subtitles);
      const value = first(row, values);
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

export function mapRoundOverview(
  lists: RoundsListViewModel,
  activeRoundId: RoundOverviewViewModel['activeRoundId'],
  data: RoundCompleteViewModel | null,
  userId?: string | number
): RoundOverviewViewModel {
  const user = data?.users.find((entry) => String(entry.id) === String(userId));
  const round = lists.rounds.find((entry) => String(entry.round_id) === String(activeRoundId));
  const players = user?.lineup?.players ?? [];
  return {
    rounds: lists.rounds,
    activeRoundId,
    description: round?.round_name ?? 'Jornada activa',
    points: Number(user?.points ?? 0).toLocaleString('es-ES'),
    ideal: Number(user?.ideal_points ?? 0).toLocaleString('es-ES'),
    efficiency: `${Number(user?.coachRating?.efficiency ?? 0).toLocaleString('es-ES')}%`,
    playerCount: players.length,
    rows: mapRoundRows(players, '/player'),
  };
}
