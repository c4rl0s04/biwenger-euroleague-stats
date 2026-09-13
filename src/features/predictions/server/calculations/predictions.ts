import type {
  ParticipationStat,
  PorraResult,
  TableStat,
  ClutchStat,
  VictoryStat,
  BestRoundStat,
  HistoryUser,
  HistoryPivotRow,
  NormalizedPrediction,
  HistoryPivot,
} from '../../models/predictions';

export async function getAchievements(data: NormalizedPrediction[]) {
  const perfect10 = data
    .filter((d) => !d.is_partial && d.aciertos >= 10)
    .map((d) => ({
      aciertos: d.aciertos,
      jornada: d.jornada,
      usuario: d.usuario,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }))
    .sort((a, b) => b.aciertos - a.aciertos);

  const completeOnly = data.filter((d) => !d.is_partial);
  const minScore = completeOnly.length > 0 ? Math.min(...completeOnly.map((d) => d.aciertos)) : 0;
  const blanked = completeOnly
    .filter((d) => d.aciertos === minScore)
    .map((d) => ({
      aciertos: d.aciertos,
      jornada: d.jornada,
      usuario: d.usuario,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }))
    .sort((a, b) => b.aciertos - a.aciertos);

  return { perfect_10: perfect10, blanked: blanked };
}

export async function getParticipation(data: NormalizedPrediction[]): Promise<ParticipationStat[]> {
  const roundCounts = data.reduce(
    (acc, curr) => {
      acc[curr.jornada] = (acc[curr.jornada] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueRounds = Array.from(new Set(data.map((d) => d.jornada))).map((name) => {
    const entry = data.find((d) => d.jornada === name);
    return { jornada: name, count: roundCounts[name], sort_id: entry?.base_round_id || 0 };
  });

  return uniqueRounds
    .sort((a, b) => a.sort_id - b.sort_id)
    .map(({ jornada, count }) => ({ jornada, count }));
}

export async function getPerformanceData(data: NormalizedPrediction[]): Promise<PorraResult[]> {
  return data
    .sort((a, b) => a.base_round_id - b.base_round_id)
    .map((d) => ({
      jornada: d.jornada,
      usuario: d.usuario,
      aciertos: d.aciertos,
      user_id: parseInt(d.user_id),
      color_index: d.color_index,
      user_icon: d.user_icon,
      is_partial: d.is_partial,
    }));
}

export async function getTableStats(data: NormalizedPrediction[]): Promise<TableStat[]> {
  const userMap = new Map<string, NormalizedPrediction[]>();
  data.forEach((d) => {
    if (!userMap.has(d.user_id)) userMap.set(d.user_id, []);
    userMap.get(d.user_id)!.push(d);
  });

  const stats = Array.from(userMap.entries()).map(([userId, userPredictions]) => {
    const complete = userPredictions.filter((p) => !p.is_partial);
    const first = userPredictions[0];

    return {
      user_id: parseInt(userId),
      usuario: first.usuario,
      user_icon: first.user_icon,
      color_index: first.color_index,
      jornadas_jugadas: complete.length,
      total_aciertos: complete.reduce((sum, p) => sum + p.aciertos, 0),
      promedio:
        complete.length > 0
          ? complete.reduce((sum, p) => sum + p.aciertos, 0) / complete.length
          : 0,
      mejor_jornada: complete.length > 0 ? Math.max(...complete.map((p) => p.aciertos)) : 0,
      peor_jornada: complete.length > 0 ? Math.min(...complete.map((p) => p.aciertos)) : 0,
      exacts: complete.filter((p) => p.aciertos >= 8).length,
      perfects: complete.filter((p) => p.aciertos >= 10).length,
    };
  });

  return stats.sort((a, b) => b.promedio - a.promedio);
}

export async function getClutchStats(data: NormalizedPrediction[]): Promise<ClutchStat[]> {
  const uniqueRounds = Array.from(new Set(data.map((d) => d.jornada)))
    .map((name) => ({
      name,
      id: data.find((d) => d.jornada === name)!.base_round_id,
    }))
    .sort((a, b) => b.id - a.id)
    .slice(0, 3)
    .map((r) => r.name);

  if (uniqueRounds.length === 0) return [];

  const userAgg = new Map<
    string,
    { usuario: string; user_id: string; icon: string; color: number; totals: number[] }
  >();

  data
    .filter((d) => uniqueRounds.includes(d.jornada) && !d.is_partial)
    .forEach((d) => {
      if (!userAgg.has(d.user_id)) {
        userAgg.set(d.user_id, {
          usuario: d.usuario,
          user_id: d.user_id,
          icon: d.user_icon || '',
          color: d.color_index,
          totals: [],
        });
      }
      userAgg.get(d.user_id)!.totals.push(d.aciertos);
    });

  return Array.from(userAgg.values())
    .map((u) => ({
      usuario: u.usuario,
      user_id: parseInt(u.user_id),
      user_icon: u.icon,
      color_index: u.color,
      avg_last_3: u.totals.length > 0 ? u.totals.reduce((a, b) => a + b, 0) / u.totals.length : 0,
    }))
    .sort((a, b) => b.avg_last_3 - a.avg_last_3);
}

export async function getVictorias(data: NormalizedPrediction[]): Promise<VictoryStat[]> {
  const complete = data.filter((d) => !d.is_partial);
  const roundWinners = new Map<string, string[]>();

  const rounds = Array.from(new Set(complete.map((d) => d.jornada)));
  rounds.forEach((round) => {
    const roundScores = complete.filter((d) => d.jornada === round);
    if (roundScores.length === 0) return;
    const max = Math.max(...roundScores.map((s) => s.aciertos));
    const winners = roundScores.filter((s) => s.aciertos === max).map((s) => s.user_id);
    roundWinners.set(round, winners);
  });

  const victoryCount = new Map<string, number>();
  roundWinners.forEach((winners) => {
    winners.forEach((id) => victoryCount.set(id, (victoryCount.get(id) || 0) + 1));
  });

  const firstEntry = (id: string) => data.find((d) => d.user_id === id)!;

  return Array.from(victoryCount.entries())
    .map(([userId, count]) => {
      const user = firstEntry(userId);
      return {
        usuario: user.usuario,
        user_id: parseInt(userId),
        user_icon: user.user_icon,
        color_index: user.color_index,
        victorias: count,
      };
    })
    .sort((a, b) => b.victorias - a.victorias);
}

export async function getBestRoundStat(data: NormalizedPrediction[]): Promise<BestRoundStat[]> {
  return data
    .filter((d) => !d.is_partial)
    .sort((a, b) => b.aciertos - a.aciertos || b.base_round_id - a.base_round_id)
    .slice(0, 5)
    .map((d) => ({
      usuario: d.usuario,
      aciertos: d.aciertos,
      jornada: d.jornada,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }));
}

export async function getHistoryPivot(data: NormalizedPrediction[]): Promise<HistoryPivot> {
  const users = Array.from(new Set(data.map((d) => d.user_id)))
    .map((id) => {
      const entry = data.find((d) => d.user_id === id)!;
      return { id: parseInt(id), name: entry.usuario, color_index: entry.color_index };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const rounds = Array.from(new Set(data.map((d) => d.jornada)))
    .map((name) => {
      const entry = data.find((d) => d.jornada === name)!;
      return { name, id: entry.base_round_id };
    })
    .sort((a, b) => a.id - b.id);

  const pivotData: HistoryPivotRow[] = rounds.map((round) => {
    const row: HistoryPivotRow = {
      id: round.id,
      name: round.name,
      scores: {},
    };

    users.forEach((user) => {
      const match = data.find((d) => d.jornada === round.name && d.user_id === String(user.id));
      row.scores[user.name] = match
        ? { score: match.aciertos, is_partial: match.is_partial }
        : { score: null, is_partial: false };
    });

    return row;
  });

  return { users, jornadas: pivotData };
}
