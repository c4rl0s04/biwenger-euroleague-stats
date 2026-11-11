import type { RoundCompleteViewModel } from '../models/round-read';

export function selectRoundManager(
  quick: RoundCompleteViewModel | undefined,
  full: RoundCompleteViewModel | undefined,
  userId: string | number | null
) {
  const find = (data: RoundCompleteViewModel | undefined) =>
    data?.users.find((user) => String(user.id) === String(userId));
  const primary = find(quick);
  const background = find(full);
  return primary?.lineup?.players.length
    ? primary
    : background?.lineup?.players.length
      ? background
      : primary || background;
}

export function hasMissingRoundPoints(player: {
  raw_points?: number | null;
  points?: number | null;
  calculated?: boolean;
}) {
  const points = 'raw_points' in player ? player.raw_points : player.points;
  return points == null && !player.calculated;
}
