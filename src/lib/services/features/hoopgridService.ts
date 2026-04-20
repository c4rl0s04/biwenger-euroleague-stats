import { db } from '@/lib/db';
import {
  hoopgridChallenges,
  hoopgridGuesses,
  players,
  playerRoundStats,
  initialSquads,
  fichajes,
} from '@/lib/db/schema';
import { eq, and, avg, count, sql, sum, max } from 'drizzle-orm';
import {
  HOOPGRID_TEAMS,
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_COUNTRIES,
  HOOPGRID_MARKET,
  HOOPGRID_OWNERSHIP,
  HOOPGRID_USER_OWNERSHIP,
  HOOPGRID_HEIGHT,
  HOOPGRID_AGE,
} from '@/lib/constants/hoopgridCriteria';
import crypto from 'crypto';

export type CriteriaType =
  | 'team'
  | 'pos'
  | 'country'
  | 'stat'
  | 'price'
  | 'stat_avg'
  | 'stat_single'
  | 'stat_total'
  | 'double_double'
  | 'percentage'
  | 'user_ownership'
  | 'ownership'
  | 'price_min'
  | 'price_max'
  | 'age_max'
  | 'age_min'
  | 'height_min'
  | 'height_max';

export interface Criteria {
  type: CriteriaType;
  value: any;
  label: string;
}

export class HoopgridService {
  static async checkCriteria(playerId: number, criteria: Criteria): Promise<boolean> {
    if (criteria.type === 'stat_avg') {
      const field = criteria.value.field as keyof typeof playerRoundStats;
      const column = playerRoundStats[field];
      if (typeof column === 'function' || !column) return false;

      const stats = await db
        .select({
          average: avg(column as any),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const averageValue = Number(stats[0]?.average || 0);
      return averageValue >= criteria.value.threshold;
    }

    if (criteria.type === 'stat_single') {
      const { max } = await import('drizzle-orm');
      const field = criteria.value.field as keyof typeof playerRoundStats;
      const column = playerRoundStats[field];
      if (typeof column === 'function' || !column) return false;

      const stats = await db
        .select({
          maximum: max(column as any),
        })
        .from(playerRoundStats)
        .where(eq(playerRoundStats.playerId, playerId));

      const maxValue = Number(stats[0]?.maximum || 0);
      return maxValue >= criteria.value.threshold;
    }

    if (criteria.type === 'stat_total') {
      const { sum } = await import('drizzle-orm');
      const field = criteria.value.field as keyof typeof playerRoundStats;
      const column = playerRoundStats[field];
      if (typeof column === 'function' || !column) return false;

      const stats = await db
        .select({
          total: sum(column as any),
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
      const madeField = criteria.value.madeField as keyof typeof playerRoundStats;
      const attField = criteria.value.attField as keyof typeof playerRoundStats;
      const madeColumn = playerRoundStats[madeField];
      const attColumn = playerRoundStats[attField];

      if (
        typeof madeColumn === 'function' ||
        !madeColumn ||
        typeof attColumn === 'function' ||
        !attColumn
      ) {
        return false;
      }

      const stats = await db
        .select({
          made: sum(madeColumn as any),
          att: sum(attColumn as any),
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
      case 'height_min':
        return (player.height || 0) >= criteria.value;
      case 'height_max':
        return (player.height || 0) <= criteria.value;
      case 'age_min':
      case 'age_max': {
        if (!player.birthDate) return false;
        const birth = new Date(player.birthDate);
        const today = new Date();
        const age =
          today.getFullYear() -
          birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (criteria.type === 'age_min') return age >= criteria.value;
        return age <= criteria.value;
      }
      default:
        return false;
    }
  }

  /**
   * Internal helper for synchronous validation once data is loaded
   */
  private static validateCriteriaSync(
    player: any,
    stats: any[],
    criteria: Criteria,
    initials: any[],
    transfers: any[]
  ): boolean {
    if (criteria.type.startsWith('stat_')) {
      if (!stats || stats.length === 0) return false;
      const field = criteria.value.field as string;
      const values = stats.map((s) => Number(s[field] || 0));
      if (criteria.type === 'stat_avg') {
        const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
        return avg >= criteria.value.threshold;
      }
      if (criteria.type === 'stat_single') return Math.max(...values) >= criteria.value.threshold;
      if (criteria.type === 'stat_total')
        return values.reduce((a, b) => a + b, 0) >= criteria.value.threshold;
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
      const madeField = criteria.value.madeField as string;
      const attField = criteria.value.attField as string;
      const totalMade = stats.reduce((a, b) => a + Number(b[madeField] || 0), 0);
      const totalAtt = stats.reduce((a, b) => a + Number(b[attField] || 0), 0);
      return totalAtt > 0 && totalMade / totalAtt >= criteria.value.threshold;
    }

    if (criteria.type === 'user_ownership') {
      const { userId, mode } = criteria.value;
      if (mode === 'current') return player.ownerId === userId;
      if (mode === 'past') {
        if (player.ownerId === userId) return false;
        const wasMine =
          initials.some((i) => i.userId === userId) ||
          transfers.some((t) => t.comprador === userId);
        return wasMine;
      }
    }

    if (criteria.type === 'ownership') {
      const isCurrentlyOwned = player.ownerId !== null;
      if (criteria.value === 'current') return isCurrentlyOwned;
      if (criteria.value === 'free') return !isCurrentlyOwned;
      const wasEverOwned = initials.length > 0 || transfers.length > 0;
      if (criteria.value === 'ever') return wasEverOwned;
      if (criteria.value === 'past_not_current') return !isCurrentlyOwned && wasEverOwned;
      if (criteria.value === 'never') return !wasEverOwned;
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
      case 'height_min':
        return (player.height || 0) >= criteria.value;
      case 'height_max':
        return (player.height || 0) <= criteria.value;
      case 'age_min':
      case 'age_max': {
        if (!player.birthDate) return false;
        const birth = new Date(player.birthDate);
        const today = new Date();
        const age =
          today.getFullYear() -
          birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        return criteria.type === 'age_min' ? age >= criteria.value : age <= criteria.value;
      }
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
    const [challenge, player, stats, initials, transfers] = await Promise.all([
      db.query.hoopgridChallenges.findFirst({ where: eq(hoopgridChallenges.id, challengeId) }),
      db.query.players.findFirst({ where: eq(players.id, playerId) }),
      db.select().from(playerRoundStats).where(eq(playerRoundStats.playerId, playerId)),
      db.select().from(initialSquads).where(eq(initialSquads.playerId, playerId)),
      db.select().from(fichajes).where(eq(fichajes.playerId, playerId)),
    ]);

    if (!challenge || !player) throw new Error('Data not found');

    const rows =
      typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [];
    const cols =
      typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [];
    const rowCriteria = rows[Math.floor(cellIndex / 3)];
    const colCriteria = cols[cellIndex % 3];

    const isRowCorrect = this.validateCriteriaSync(player, stats, rowCriteria, initials, transfers);
    const isColCorrect = this.validateCriteriaSync(player, stats, colCriteria, initials, transfers);
    const isCorrect = isRowCorrect && isColCorrect;

    let rarity = null;
    if (isCorrect) {
      rarity = await this.getRarity(challengeId, cellIndex, playerId, challenge);
    }

    if (dryRun) {
      return {
        isCorrect,
        rarity,
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

    return {
      isCorrect,
      rarity,
      guess,
    };
  }

  /**
   * Calculates rarity for a specific correct guess.
   * Uses a single GROUP BY query — O(1) regardless of player count.
   */
  static async getRarity(
    challengeId: string,
    cellIndex: number,
    playerId: number,
    _existingChallenge?: any
  ) {
    // Single query: count how many people picked each player for this cell today
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
    const playerPicks = results.find((r) => r.playerId === playerId)?.count || 0;

    // Laplace smoothing: add 1 to numerator and denominator to avoid 0%/100% extremes
    const virtualTotal = totalCorrectGuesses + 1;
    const virtualPlayerPicks = playerPicks + 1;

    return (virtualPlayerPicks * 100) / virtualTotal;
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
    const allUsers = Array.from(
      new Set([...allInitial.map((i) => i.userId), ...allFichajes.map((f) => f.comprador)])
    ).filter((u): u is string => !!u);

    allUsers.forEach((u) => userOwnershipHistory.set(u, new Set()));
    allInitial.forEach((i) => userOwnershipHistory.get(i.userId)?.add(i.playerId));
    allFichajes.forEach((f) => {
      if (f.comprador) userOwnershipHistory.get(f.comprador)?.add(f.playerId);
    });

    const everOwnedIds = new Set<number>();
    userOwnershipHistory.forEach((set) => set.forEach((id: number) => everOwnedIds.add(id)));

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
        return stats.some((s: any) => {
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
      if (criteria.type === 'height_min') return (player.height || 0) >= criteria.value;
      if (criteria.type === 'height_max') return (player.height || 0) <= criteria.value;
      if (criteria.type === 'age_min' || criteria.type === 'age_max') {
        if (!player.birthDate) return false;
        const birth = new Date(player.birthDate);
        const today = new Date();
        const age =
          today.getFullYear() -
          birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (criteria.type === 'age_min') return age >= criteria.value;
        return age <= criteria.value;
      }
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
        ...HOOPGRID_HEIGHT,
        ...HOOPGRID_AGE,
      ];
      cols = pickN(colPool, 3).map((item) => ({
        type: item.type || 'country',
        // For simple numeric value criteria (height, age, market, country), use value directly.
        // For stat criteria that embed field/threshold inside value, preserve that object.
        value:
          item.value !== undefined
            ? item.value
            : { field: (item as any).field, threshold: (item as any).threshold },
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
          if (count < 1) {
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
