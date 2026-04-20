import { db } from '@/lib/db';
import {
  hoopgridChallenges,
  hoopgridGuesses,
  players,
  playerRoundStats,
  initialSquads,
  fichajes,
} from '@/lib/db/schema';
import { eq, and, avg, count, sql } from 'drizzle-orm';
import {
  HOOPGRID_TEAMS,
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_COUNTRIES,
  HOOPGRID_MARKET,
  HOOPGRID_OWNERSHIP,
  HOOPGRID_USER_OWNERSHIP,
} from '@/lib/constants/hoopgridCriteria';
import crypto from 'crypto';

export type CriteriaType = 'team' | 'pos' | 'country' | 'stat' | 'price';

export interface Criteria {
  type: CriteriaType;
  value: any;
  label: string;
}

export class HoopgridService {
  static async checkCriteria(playerId: number, criteria: Criteria): Promise<boolean> {
    if (criteria.type === 'stat_avg') {
      const stats = await db
        .select({
          average: avg(playerRoundStats[criteria.value.field as keyof typeof playerRoundStats]),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const averageValue = Number(stats[0]?.average || 0);
      return averageValue >= criteria.value.threshold;
    }

    if (criteria.type === 'stat_single') {
      const { max } = await import('drizzle-orm');
      const stats = await db
        .select({
          maximum: max(playerRoundStats[criteria.value.field as keyof typeof playerRoundStats]),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const maxValue = Number(stats[0]?.maximum || 0);
      return maxValue >= criteria.value.threshold;
    }

    if (criteria.type === 'stat_total') {
      const { sum } = await import('drizzle-orm');
      const stats = await db
        .select({
          total: sum(playerRoundStats[criteria.value.field as keyof typeof playerRoundStats]),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const totalValue = Number(stats[0]?.total || 0);
      return totalValue >= criteria.value.threshold;
    }

    if (criteria.type === 'double_double') {
      const allStats = await db
        .select()
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      return allStats.some((s) => {
        const counts = [
          (s.points || 0) >= 10,
          (s.rebounds || 0) >= 10,
          (s.assists || 0) >= 10,
          (s.steals || 0) >= 10,
          (s.blocks || 0) >= 10,
        ].filter(Boolean).length;
        return counts >= 2;
      });
    }

    if (criteria.type === 'percentage') {
      const { sum } = await import('drizzle-orm');
      const stats = await db
        .select({
          made: sum(playerRoundStats[criteria.value.madeField as keyof typeof playerRoundStats]),
          att: sum(playerRoundStats[criteria.value.attField as keyof typeof playerRoundStats]),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const made = Number(stats[0]?.made || 0);
      const att = Number(stats[0]?.att || 0);
      if (att === 0) return false;
      return made / att >= criteria.value.threshold;
    }

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) return false;

    if (criteria.type === 'user_ownership') {
      const { userId, mode } = criteria.value;
      if (mode === 'current') return player.ownerId === userId;
      if (mode === 'past') {
        if (player.ownerId === userId) return false;
        const [initial] = await db
          .select()
          .from(initialSquads)
          .where(and(eq(initialSquads.playerId, playerId), eq(initialSquads.userId, userId)));
        const [transfer] = await db
          .select()
          .from(fichajes)
          .where(and(eq(fichajes.playerId, playerId), eq(fichajes.comprador, userId)));
        return !!(initial || transfer);
      }
    }

    if (criteria.type === 'ownership') {
      const isCurrentlyOwned = player.ownerId !== null;
      if (criteria.value === 'current') return isCurrentlyOwned;
      if (criteria.value === 'free') return !isCurrentlyOwned;

      // Historical checks need additional DB lookups if not in memory
      if (criteria.value === 'ever' || criteria.value === 'past_not_current') {
        const [initial] = await db
          .select()
          .from(initialSquads)
          .where(eq(initialSquads.playerId, playerId));
        const [transfer] = await db.select().from(fichajes).where(eq(fichajes.playerId, playerId));
        const wasEverOwned = !!(initial || transfer);

        if (criteria.value === 'ever') return wasEverOwned;
        return !isCurrentlyOwned && wasEverOwned;
      }

      if (criteria.value === 'never') {
        const [initial] = await db
          .select()
          .from(initialSquads)
          .where(eq(initialSquads.playerId, playerId));
        const [transfer] = await db.select().from(fichajes).where(eq(fichajes.playerId, playerId));
        return !initial && !transfer;
      }
    }

    switch (criteria.type) {
      case 'team':
        return player.teamId === criteria.value;
      case 'pos':
        return player.position === criteria.value;
      case 'country':
        return player.country === criteria.value;
      case 'price_min':
        return (player.price || 0) >= criteria.value;
      case 'price_max':
        return (player.price || 0) <= criteria.value;
      default:
        return false;
    }
  }

  /**
   * Records or validates a user's guess
   */
  static async submitGuess(
    challengeId: string,
    userId: string,
    cellIndex: number,
    playerId: number,
    dryRun: boolean = false
  ) {
    const challenge = await db.query.hoopgridChallenges.findFirst({
      where: eq(hoopgridChallenges.id, challengeId),
    });

    if (!challenge) throw new Error('Challenge not found');

    const rows =
      typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [];
    const cols =
      typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [];

    const rowIndex = Math.floor(cellIndex / 3);
    const colIndex = cellIndex % 3;

    const isCorrectRow = await this.checkCriteria(playerId, rows[rowIndex]);
    const isCorrectCol = await this.checkCriteria(playerId, cols[colIndex]);
    const isCorrect = isCorrectRow && isCorrectCol;

    if (dryRun) {
      return {
        isCorrect,
        guess: { id: 'draft', challengeId, userId, cellIndex, playerId, isCorrect },
      };
    }

    const [guess] = await db
      .insert(hoopgridGuesses)
      .values({
        id: crypto.randomUUID(),
        challengeId,
        userId,
        cellIndex,
        playerId,
        isCorrect,
      })
      .onConflictDoUpdate({
        target: [hoopgridGuesses.challengeId, hoopgridGuesses.userId, hoopgridGuesses.cellIndex],
        set: { playerId, isCorrect, createdAt: new Date() },
      })
      .returning();

    return { isCorrect, guess };
  }

  /**
   * Calculates rarity for a specific correct guess
   */
  static async getRarity(challengeId: string, cellIndex: number, playerId: number) {
    const results = await db
      .select({
        playerId: hoopgridGuesses.playerId,
        count: count(),
      })
      .from(hoopgridGuesses)
      .where(
        and(
          eq(hoopgridGuesses.challengeId, challengeId),
          eq(hoopgridGuesses.cellIndex, cellIndex),
          eq(hoopgridGuesses.isCorrect, true)
        )
      )
      .groupBy(hoopgridGuesses.playerId);

    const totalCorrectGuesses = results.reduce((acc, curr) => acc + curr.count, 0);
    let playerPicks = results.find((r) => r.playerId === playerId)?.count || 0;

    const virtualTotal = totalCorrectGuesses + 1;
    const virtualPlayerPicks = playerPicks + 1;
    const popularityRarity = (virtualPlayerPicks * 100) / virtualTotal;

    // 2. Points-Weighted Rarity
    // We look at all players who fit this cell and see where our player sits in terms of performance (points).
    const challenge = await db.query.hoopgridChallenges.findFirst({
      where: eq(hoopgridChallenges.id, challengeId),
    });

    if (!challenge) return popularityRarity;

    const rows = typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows;
    const cols = typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols;
    const rowIndex = Math.floor(cellIndex / 3);
    const colIndex = cellIndex % 3;

    // Get all players that fit this cell to find the points range
    const allPlayers = await db.select({ puntos: players.puntos, id: players.id }).from(players);
    let maxPoints = 1;
    let myPoints = 0;

    for (const p of allPlayers) {
      const fits =
        (await HoopgridService.checkCriteria(p.id, rows[rowIndex])) &&
        (await HoopgridService.checkCriteria(p.id, cols[colIndex]));

      if (fits) {
        const pPoints = p.puntos || 0;
        if (pPoints > maxPoints) maxPoints = pPoints;
        if (p.id === playerId) myPoints = pPoints;
      }
    }

    // Performance Rarity: Your points relative to the "top contributor" choice.
    // We add a small offset to avoid 0% and handle players with 0 points fairly.
    const performanceWeight = Math.max(0.05, (myPoints + 1) / (maxPoints + 1));

    // Final Rarity: Popularity scaled by Performance Weight
    return popularityRarity * performanceWeight;
  }

  /**
   * Generates a random daily challenge
   */
  static async generateDailyChallenge(targetDate?: string) {
    const start = Date.now();
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    const pickN = (arr: any[], n: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

    let rows, cols, possibleCounts;
    let attempts = 0;

    // 1. Fetch all data once to process in memory
    const allPlayers = await db.select().from(players);
    const allStats = await db.select().from(playerRoundStats);
    const allInitial = await db.select().from(initialSquads);
    const allFichajes = await db.select().from(fichajes);

    const userOwnershipHistory = new Map();
    const allUsers = [
      ...new Set([...allInitial.map((i) => i.userId), ...allFichajes.map((f) => f.comprador)]),
    ].filter(Boolean);

    allUsers.forEach((u) => userOwnershipHistory.set(u, new Set()));
    allInitial.forEach((i) => userOwnershipHistory.get(i.userId)?.add(i.playerId));
    allFichajes.forEach((f) => {
      if (f.comprador) userOwnershipHistory.get(f.comprador)?.add(f.playerId);
    });

    const everOwnedIds = new Set();
    userOwnershipHistory.forEach((set) => set.forEach((id) => everOwnedIds.add(id)));

    // 2. Pre-process player stats into a map for fast lookup
    const playerStatsMap = new Map();
    for (const s of allStats) {
      if (!playerStatsMap.get(s.playerId)) playerStatsMap.set(s.playerId, []);
      playerStatsMap.get(s.playerId).push(s);
    }

    // 3. Helper for in-memory criteria checking
    const checkCriteriaInMemory = (player: any, criteria: any) => {
      const stats = playerStatsMap.get(player.id) || [];

      if (criteria.type === 'user_ownership') {
        const { userId, mode } = criteria.value;
        const history = userOwnershipHistory.get(userId);
        if (mode === 'current') return player.ownerId === userId;
        if (mode === 'past') return history?.has(player.id) && player.ownerId !== userId;
        return false;
      }

      if (criteria.type === 'ownership') {
        const isCurrentlyOwned = player.ownerId !== null;
        const wasEverOwned = everOwnedIds.has(player.id);

        if (criteria.value === 'current') return isCurrentlyOwned;
        if (criteria.value === 'free') return !isCurrentlyOwned;
        if (criteria.value === 'ever') return wasEverOwned;
        if (criteria.value === 'never') return !wasEverOwned;
        if (criteria.value === 'past_not_current') return !isCurrentlyOwned && wasEverOwned;
        return false;
      }

      if (criteria.type === 'stat_avg') {
        if (stats.length === 0) return false;
        const sumVal = stats.reduce(
          (acc: number, s: any) => acc + (s[criteria.value.field] || 0),
          0
        );
        return sumVal / stats.length >= criteria.value.threshold;
      }
      if (criteria.type === 'stat_single') {
        return stats.some((s: any) => (s[criteria.value.field] || 0) >= criteria.value.threshold);
      }
      if (criteria.type === 'stat_total') {
        const sumVal = stats.reduce(
          (acc: number, s: any) => acc + (s[criteria.value.field] || 0),
          0
        );
        return sumVal >= criteria.value.threshold;
      }
      if (criteria.type === 'double_double') {
        return stats.some((s) => {
          const counts = [
            (s.points || 0) >= 10,
            (s.rebounds || 0) >= 10,
            (s.assists || 0) >= 10,
            (s.steals || 0) >= 10,
            (s.blocks || 0) >= 10,
          ].filter(Boolean).length;
          return counts >= 2;
        });
      }
      if (criteria.type === 'percentage') {
        const made = stats.reduce(
          (acc: number, s: any) => acc + (s[criteria.value.madeField] || 0),
          0
        );
        const att = stats.reduce(
          (acc: number, s: any) => acc + (s[criteria.value.attField] || 0),
          0
        );
        return att > 0 && made / att >= criteria.value.threshold;
      }
      if (criteria.type === 'team') return player.teamId === criteria.value;
      if (criteria.type === 'pos') return player.position === criteria.value;
      if (criteria.type === 'country') return player.country === criteria.value;
      if (criteria.type === 'price_min') return (player.price || 0) >= criteria.value;
      if (criteria.type === 'price_max') return (player.price || 0) <= criteria.value;
      return false;
    };

    while (attempts < 100) {
      attempts++;
      const rowPool = [...HOOPGRID_TEAMS, ...HOOPGRID_POSITIONS];
      rows = pickN(rowPool, 3).map((item) => ({
        type: item.id ? 'team' : 'pos',
        value: item.id || item.value,
        label: item.label,
      }));

      const colPool = [
        ...HOOPGRID_STATS,
        ...HOOPGRID_COUNTRIES,
        ...HOOPGRID_MARKET,
        ...HOOPGRID_OWNERSHIP,
        ...HOOPGRID_USER_OWNERSHIP,
      ];
      cols = pickN(colPool, 3).map((item) => ({
        type: item.type || 'country',
        value: item.value || { field: item.field, threshold: item.threshold },
        label: item.label,
      }));

      possibleCounts = [];
      let isCompletable = true;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          let count = 0;
          for (const player of allPlayers) {
            if (checkCriteriaInMemory(player, rows[r]) && checkCriteriaInMemory(player, cols[c])) {
              count++;
            }
          }
          if (count === 0) {
            isCompletable = false;
            break;
          }
          possibleCounts.push(count);
        }
        if (!isCompletable) break;
      }

      if (isCompletable) {
        console.log(
          `Generated completable hoopgrid for ${dateStr} in ${attempts} attempts (${Date.now() - start}ms).`
        );
        break;
      }
    }

    const [challenge] = await db
      .insert(hoopgridChallenges)
      .values({
        id: crypto.randomUUID(),
        gameDate: dateStr,
        rows: JSON.stringify(rows),
        cols: JSON.stringify(cols),
        possibleCounts: JSON.stringify(possibleCounts),
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [hoopgridChallenges.gameDate],
        set: {
          rows: JSON.stringify(rows),
          cols: JSON.stringify(cols),
          possibleCounts: JSON.stringify(possibleCounts),
        },
      })
      .returning();

    return challenge;
  }
}

// Export as an object for backward compatibility with your API routes
export const hoopgridService = HoopgridService;
