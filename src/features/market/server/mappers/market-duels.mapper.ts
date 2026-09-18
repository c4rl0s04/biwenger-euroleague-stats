import type {
  BiddingDuelsStats,
  BidDuelRecord,
  BidDuelSummary,
} from '../../models/market-overview';
import type { MarketDuelFacts } from '../queries/market-overview.records';
export function mapMarketDuels(rows: MarketDuelFacts): BiddingDuelsStats {
  const users = rows.users.map((user) => ({
    id: parseInt(String(user.id)),
    name: user.name,
    icon: user.icon,
    color_index: user.color_index !== null ? parseInt(String(user.color_index)) : null,
  }));

  const matrix: Record<number, Record<number, BidDuelRecord>> = {};
  users.forEach((user) => {
    matrix[user.id] = {};
    users.forEach((opponent) => {
      if (user.id !== opponent.id) {
        matrix[user.id][opponent.id] = {
          wins: 0,
          losses: 0,
          duels: 0,
          total_margin: 0,
          avg_margin: 0,
        };
      }
    });
  });

  const pairMap = new Map<string, BidDuelSummary>();

  rows.duels.forEach((duel) => {
    const winnerId = parseInt(String(duel.winner_id));
    const runnerId = parseInt(String(duel.runner_id));
    const margin = parseInt(String(duel.margin)) || 0;

    if (!matrix[winnerId] || !matrix[runnerId]) return;

    matrix[winnerId][runnerId].wins += 1;
    matrix[winnerId][runnerId].duels += 1;
    matrix[winnerId][runnerId].total_margin += margin;

    matrix[runnerId][winnerId].losses += 1;
    matrix[runnerId][winnerId].duels += 1;
    matrix[runnerId][winnerId].total_margin += margin;

    const user1Id = Math.min(winnerId, runnerId);
    const user2Id = Math.max(winnerId, runnerId);
    const pairKey = `${user1Id}-${user2Id}`;

    if (!pairMap.has(pairKey)) {
      const lowerUser = user1Id === winnerId ? duel.winner_name : duel.runner_name;
      const higherUser = user2Id === winnerId ? duel.winner_name : duel.runner_name;
      const lowerIcon = user1Id === winnerId ? duel.winner_icon : duel.runner_icon;
      const higherIcon = user2Id === winnerId ? duel.winner_icon : duel.runner_icon;
      const lowerColor = user1Id === winnerId ? duel.winner_color_index : duel.runner_color_index;
      const higherColor = user2Id === winnerId ? duel.winner_color_index : duel.runner_color_index;

      pairMap.set(pairKey, {
        user1_id: user1Id,
        user1_name: lowerUser,
        user1_icon: lowerIcon,
        user1_color_index: lowerColor !== null ? parseInt(String(lowerColor)) : null,
        user2_id: user2Id,
        user2_name: higherUser,
        user2_icon: higherIcon,
        user2_color_index: higherColor !== null ? parseInt(String(higherColor)) : null,
        wins1: 0,
        wins2: 0,
        duels: 0,
        total_margin: 0,
        avg_margin: 0,
        leader_id: null,
        leader_name: null,
        trailer_id: null,
        trailer_name: null,
      });
    }

    const pair = pairMap.get(pairKey)!;
    pair.duels += 1;
    pair.total_margin += margin;

    if (winnerId === pair.user1_id) pair.wins1 += 1;
    else pair.wins2 += 1;
  });

  Object.values(matrix).forEach((opponents) => {
    Object.values(opponents).forEach((record) => {
      if (record.duels > 0) {
        record.avg_margin = record.total_margin / record.duels;
      }
    });
  });

  const pairs = Array.from(pairMap.values()).map((pair) => {
    const avg_margin = pair.duels > 0 ? pair.total_margin / pair.duels : 0;
    let leader_id: number | null = null;
    let leader_name: string | null = null;
    let trailer_id: number | null = null;
    let trailer_name: string | null = null;

    if (pair.wins1 > pair.wins2) {
      leader_id = pair.user1_id;
      leader_name = pair.user1_name;
      trailer_id = pair.user2_id;
      trailer_name = pair.user2_name;
    } else if (pair.wins2 > pair.wins1) {
      leader_id = pair.user2_id;
      leader_name = pair.user2_name;
      trailer_id = pair.user1_id;
      trailer_name = pair.user1_name;
    }

    return {
      ...pair,
      avg_margin,
      leader_id,
      leader_name,
      trailer_id,
      trailer_name,
    };
  });

  const hottestRivalry =
    pairs.length > 0
      ? [...pairs].sort((a, b) => {
          if (b.duels !== a.duels) return b.duels - a.duels;
          return a.avg_margin - b.avg_margin;
        })[0]
      : null;

  const biggestDominance =
    pairs.length > 0
      ? [...pairs]
          .filter((pair) => pair.duels >= 2)
          .sort((a, b) => {
            const diffA = Math.abs(a.wins1 - a.wins2);
            const diffB = Math.abs(b.wins1 - b.wins2);
            if (diffB !== diffA) return diffB - diffA;
            return b.duels - a.duels;
          })[0] || null
      : null;

  return {
    users,
    matrix,
    hottestRivalry,
    biggestDominance,
  };
}
