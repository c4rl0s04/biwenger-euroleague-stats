export {
  getExtendedStandings,
  getRoundWinners,
  getLeagueTotals,
  getPointsProgression,
  getValueRanking,
  getWinCounts,
  getSimpleStandings,
} from '@/features/standings/server';
import { getSimpleStandings } from '@/features/standings/server';
import { db } from '@/lib/db';
import { userRounds } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { sql } from 'drizzle-orm';

export async function getLeaderComparison(userId: string) {
  // Reuse our own getSimpleStandings
  const standings = await getSimpleStandings();
  const leader = standings[0];
  const secondPlace = standings[1];

  // Ensure we compare strings properly if IDs are mixed types in DB/JS
  // Drizzle result rows are untyped ‘any’ by default unless mapped, but we know the shape.
  const user = standings.find((u: any) => String(u.user_id) === String(userId));

  if (!user || !leader) return null;

  // Cast for safety
  const leaderPoints = (leader as any).total_points;
  const userPoints = (user as any).total_points;

  const gap = leaderPoints - userPoints;
  const pos = (user as any).position;
  const roundsNeeded = pos > 1 ? Math.ceil(gap / 10) : 0;

  const gapToSecond = pos === 1 && secondPlace ? userPoints - (secondPlace as any).total_points : 0;

  return {
    leader_name: (leader as any).name,
    leader_points: leaderPoints,
    user_points: userPoints,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: pos === 1,
  };
}

export async function getLeagueAveragePoints() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    SELECT ROUND(AVG(points), 1)::float as avg_points
    FROM ${userRounds}
    WHERE season_id = ${seasonId}
      AND participated = TRUE
  `);

  return result.rows[0] ? result.rows[0].avg_points : 0;
}
