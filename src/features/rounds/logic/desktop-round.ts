import type { RoundCompleteViewModel, RoundLineupPlayerViewModel } from '../models/round-read';

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

export function hasPendingRoundPoints(
  player: Pick<RoundLineupPlayerViewModel, 'raw_points' | 'calculated'>
) {
  return player.raw_points === null && !player.calculated;
}
