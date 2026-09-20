import 'server-only';
import type { CompareDataLiteResponse, CompareOpponentModel } from '../../models/compare';
import { findCompareManager } from '../../validation/selection';

export function mapCompareOpponent(
  data: CompareDataLiteResponse,
  userId: string,
  sessionUserId?: string | number | null
): CompareOpponentModel | null {
  const currentId = sessionUserId ?? data.users[0]?.id;
  const current = findCompareManager(data.users, currentId);
  const opponent = findCompareManager(data.users, userId);
  if (!current || !opponent) return null;
  const currentHistory = data.history.find((entry) => String(entry.userId) === String(current.id));
  const opponentHistory = data.history.find(
    (entry) => String(entry.userId) === String(opponent.id)
  );
  return {
    current,
    opponent,
    currentStanding: data.standings.find((row) => String(row.user_id) === String(current.id)),
    opponentStanding: data.standings.find((row) => String(row.user_id) === String(opponent.id)),
    recentHistory: [
      ...(currentHistory?.history ?? []).slice(-5),
      ...(opponentHistory?.history ?? []).slice(-5),
    ],
  };
}
