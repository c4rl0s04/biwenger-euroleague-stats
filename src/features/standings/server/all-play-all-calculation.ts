import type {
  AllPlayAllComputedRecord,
  AllPlayAllScoreRecord,
  AllPlayAllUserRecord,
} from './queries/all-play-all.records';

export function createAllPlayAllCalculation(users: AllPlayAllUserRecord[]) {
  // Preserve Object.values numeric-key enumeration and stable percentage ordering.
  const standings: Record<string, Omit<AllPlayAllComputedRecord, 'pct'>> = {};
  users.forEach((user) => {
    standings[user.id] = {
      user_id: user.id,
      name: user.name,
      icon: user.icon,
      color_index: user.color_index,
      wins: 0,
      losses: 0,
      ties: 0,
    };
  });
  return {
    addRound(roundScores: AllPlayAllScoreRecord[]) {
      for (let i = 0; i < roundScores.length; i++) {
        for (let j = i + 1; j < roundScores.length; j++) {
          const u1 = roundScores[i];
          const u2 = roundScores[j];
          if (!standings[u1.user_id] || !standings[u2.user_id]) continue;
          // Non-null assertions are type-only: retain JavaScript's legacy null comparisons.
          if (u1.points! > u2.points!) {
            standings[u1.user_id].wins++;
            standings[u2.user_id].losses++;
          } else if (u2.points! > u1.points!) {
            standings[u2.user_id].wins++;
            standings[u1.user_id].losses++;
          } else {
            standings[u1.user_id].ties++;
            standings[u2.user_id].ties++;
          }
        }
      }
    },
    finish(): AllPlayAllComputedRecord[] {
      return Object.values(standings)
        .map((row) => ({ ...row, pct: (row.wins / (row.wins + row.losses + row.ties)) * 100 }))
        .sort((a, b) => b.pct - a.pct);
    },
  };
}
