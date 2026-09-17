import 'server-only';
import { getTeamNames } from '@/features/teams/server';
import { getPlayoffLeaderboard } from './playoffs.service';
import type { PlayoffDetailModel, PlayoffOverviewModel } from '../../models/playoff-screen';

/** Existing caller supplies presentation detection; leaderboard starts concurrently with it. */
export async function getPlayoffOverview(phone: Promise<boolean>): Promise<PlayoffOverviewModel> {
  const [leaderboard, isPhone] = await Promise.all([getPlayoffLeaderboard(), phone]);
  if (isPhone) return { presentation: 'phone', leaderboard };
  return { presentation: 'desktop', leaderboard, teams: await getTeamNames() };
}

/** Called after the existing mobile route guard. Keep exact textual IDs and null missing state. */
export async function getPlayoffDetail(userId: string): Promise<PlayoffDetailModel | null> {
  const leaderboard = await getPlayoffLeaderboard();
  const user = leaderboard.find((entry) => String(entry.userId) === String(userId));
  if (!user) return null;
  return {
    user,
    rows: user.predictions.slice(0, 20).map((prediction, index) => ({
      // MobileRecordList prefers user_id, not userId, so its existing fallback is prediction.id.
      key: String(prediction.id ?? index),
      title: `Registro ${index + 1}`,
      ...(prediction.points == null
        ? {}
        : { value: Number(prediction.points).toLocaleString('es-ES') }),
    })),
  };
}
