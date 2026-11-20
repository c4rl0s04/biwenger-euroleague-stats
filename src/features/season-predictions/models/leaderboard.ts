import type { PredictionPhase } from './phases';

export interface LeaderboardMember {
  userId: string;
  name: string;
  image: string | null;
}

export interface PhasePoints {
  points: number;
  provisional: boolean;
}

export interface LeaderboardRow extends LeaderboardMember {
  /** Competition rank by total: equal totals share a rank. */
  rank: number;
  total: number;
  /** null when the member has no scored submission for that phase. */
  phases: Record<PredictionPhase, number | null>;
  provisional: boolean;
}

export function combineLeaderboard(
  members: readonly LeaderboardMember[],
  preseasonByUser: ReadonlyMap<string, PhasePoints>,
  playoffsByUser: ReadonlyMap<string, PhasePoints>
): LeaderboardRow[] {
  const rows = members.map((member) => {
    const preseason = preseasonByUser.get(member.userId);
    const playoffs = playoffsByUser.get(member.userId);
    return {
      ...member,
      rank: 0,
      total: (preseason?.points ?? 0) + (playoffs?.points ?? 0),
      phases: { preseason: preseason?.points ?? null, playoffs: playoffs?.points ?? null },
      provisional: Boolean(preseason?.provisional || playoffs?.provisional),
    };
  });
  rows.sort(
    (left, right) =>
      right.total - left.total ||
      left.name.localeCompare(right.name, 'es') ||
      left.userId.localeCompare(right.userId)
  );
  rows.forEach((row, index) => {
    row.rank = index > 0 && rows[index - 1].total === row.total ? rows[index - 1].rank : index + 1;
  });
  return rows;
}
