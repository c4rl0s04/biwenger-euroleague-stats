import { db } from '@/lib/db';
import { hoopgridChallenges, hoopgridGuesses, players, playerRoundStats } from '@/lib/db/schema';
import { eq, and, avg, count, sql } from 'drizzle-orm';
import {
  HOOPGRID_TEAMS,
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_COUNTRIES,
} from '@/lib/constants/hoopgridCriteria';

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
    const playerPicks = results.find((r) => r.playerId === playerId)?.count || 0;

    return totalCorrectGuesses > 0 ? (playerPicks * 100) / totalCorrectGuesses : 100;
  }

  /**
   * Generates a random daily challenge
   */
  static async generateDailyChallenge(targetDate?: string) {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    const pickN = (arr: any[], n: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

    const rowPool = [...HOOPGRID_TEAMS, ...HOOPGRID_POSITIONS];
    const rows = pickN(rowPool, 3).map((item) => ({
      type: item.id ? 'team' : 'pos',
      value: item.id || item.value,
      label: item.label,
    }));

    const colPool = [...HOOPGRID_STATS, ...HOOPGRID_COUNTRIES];
    const cols = pickN(colPool, 3).map((item) => ({
      type: item.type || 'country',
      value: item.value || { field: item.field, threshold: item.threshold },
      label: item.label,
    }));

    const [challenge] = await db
      .insert(hoopgridChallenges)
      .values({
        id: crypto.randomUUID(),
        gameDate: dateStr,
        rows: JSON.stringify(rows),
        cols: JSON.stringify(cols),
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [hoopgridChallenges.gameDate],
        set: { rows: JSON.stringify(rows), cols: JSON.stringify(cols) },
      })
      .returning();

    return challenge;
  }
}

// Export as an object for backward compatibility with your API routes
export const hoopgridService = HoopgridService;
