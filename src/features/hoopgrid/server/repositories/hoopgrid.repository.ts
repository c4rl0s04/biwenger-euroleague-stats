import 'server-only';

import { db } from '@/lib/db';
import {
  hoopgridChallenges,
  hoopgridGuesses,
  players,
  playerSeasons,
  playerRoundStats,
  initialSquads,
  fichajes,
  teams,
  userSeasons,
} from '@/lib/db/schema';
import { eq, and, count, max, desc } from 'drizzle-orm';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import crypto from 'crypto';

export class HoopgridRepository {
  private mergeSeasonPlayer(row: { player: any; season: any }) {
    return {
      ...row.player,
      ownerId: row.season.ownerId,
      teamId: row.season.teamId ?? row.player.teamId,
      price: row.season.price ?? row.player.price,
      priceIncrement: row.season.priceIncrement ?? row.player.priceIncrement,
      puntos: row.season.puntos ?? row.player.puntos,
      status: row.season.status ?? row.player.status,
    };
  }

  async findLatestChallenge() {
    return db.query.hoopgridChallenges.findFirst({ orderBy: desc(hoopgridChallenges.gameDate) });
  }

  async findChallengeByDate(dateStr: string) {
    return await db.query.hoopgridChallenges.findFirst({
      where: (ch, { eq, and }) => and(eq(ch.gameDate, dateStr), eq(ch.isActive, true)),
    });
  }

  async findChallengeById(id: string) {
    return await db.query.hoopgridChallenges.findFirst({
      where: eq(hoopgridChallenges.id, id),
    });
  }

  async listChallenges() {
    return await db
      .select({
        id: hoopgridChallenges.id,
        gameDate: hoopgridChallenges.gameDate,
        number: hoopgridChallenges.number,
        possibleCounts: hoopgridChallenges.possibleCounts,
      })
      .from(hoopgridChallenges)
      .orderBy(desc(hoopgridChallenges.gameDate));
  }

  async getNextChallengeNumber(targetDate: string): Promise<number> {
    const existing = await db.query.hoopgridChallenges.findFirst({
      where: eq(hoopgridChallenges.gameDate, targetDate),
    });

    if (existing?.number) {
      return existing.number;
    }

    const [maxRes] = await db
      .select({ val: max(hoopgridChallenges.number) })
      .from(hoopgridChallenges);

    return (maxRes?.val || 0) + 1;
  }

  /**
   * Concurrency-safe challenge insertion.
   * If a concurrent request already inserted a challenge for targetDate,
   * returns the existing record rather than overwriting.
   */
  async insertChallengeSafely(data: {
    id: string;
    gameDate: string;
    rows: string;
    cols: string;
    number: number;
    possibleCounts: string;
    isActive: boolean;
  }) {
    const inserted = await db
      .insert(hoopgridChallenges)
      .values(data)
      .onConflictDoNothing({ target: [hoopgridChallenges.gameDate] })
      .returning();

    if (inserted.length > 0) {
      return inserted[0];
    }

    // Another process inserted first: return existing challenge
    const existing = await this.findChallengeByDate(data.gameDate);
    if (!existing) {
      // Fallback query without isActive filter
      return await db.query.hoopgridChallenges.findFirst({
        where: eq(hoopgridChallenges.gameDate, data.gameDate),
      });
    }
    return existing;
  }

  async getUserGuesses(challengeId: string, userId: string) {
    return await db
      .select({
        cellIndex: hoopgridGuesses.cellIndex,
        playerId: hoopgridGuesses.playerId,
        isCorrect: hoopgridGuesses.isCorrect,
        playerName: players.name,
        playerImg: players.img,
      })
      .from(hoopgridGuesses)
      .leftJoin(players, eq(hoopgridGuesses.playerId, players.id))
      .where(and(eq(hoopgridGuesses.challengeId, challengeId), eq(hoopgridGuesses.userId, userId)));
  }

  async getRarity(
    challengeId: string,
    cellIndex: number,
    playerId: number,
    userId: string
  ): Promise<number> {
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

    const totalInDB = results.reduce((acc, curr) => acc + curr.count, 0);
    const picksInDB = results.find((r) => r.playerId === playerId)?.count || 0;

    const [existing] = await db
      .select()
      .from(hoopgridGuesses)
      .where(
        and(
          eq(hoopgridGuesses.challengeId, challengeId),
          eq(hoopgridGuesses.cellIndex, cellIndex),
          eq(hoopgridGuesses.userId, userId),
          eq(hoopgridGuesses.isCorrect, true)
        )
      );

    const finalTotal = existing ? totalInDB : totalInDB + 1;
    const finalPicks = existing ? picksInDB : picksInDB + 1;

    return (finalPicks * 100) / (finalTotal || 1);
  }

  async upsertGuess(data: {
    challengeId: string;
    userId: string;
    cellIndex: number;
    playerId: number;
    isCorrect: boolean;
  }) {
    const [guess] = await db
      .insert(hoopgridGuesses)
      .values({
        id: crypto.randomUUID(),
        challengeId: data.challengeId,
        userId: data.userId,
        cellIndex: data.cellIndex,
        playerId: data.playerId,
        isCorrect: data.isCorrect,
      })
      .onConflictDoUpdate({
        target: [hoopgridGuesses.challengeId, hoopgridGuesses.userId, hoopgridGuesses.cellIndex],
        set: { playerId: data.playerId, isCorrect: data.isCorrect, createdAt: new Date() },
      })
      .returning();

    return guess;
  }

  async getSeasonPlayer(playerId: number, seasonId: string) {
    const [row] = await db
      .select({ player: players, season: playerSeasons })
      .from(players)
      .innerJoin(
        playerSeasons,
        and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
      )
      .where(eq(players.id, playerId));

    return row ? this.mergeSeasonPlayer(row) : null;
  }

  async getSeasonPlayers(seasonId: string) {
    const rows = await db
      .select({ player: players, season: playerSeasons })
      .from(players)
      .innerJoin(
        playerSeasons,
        and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
      );

    return rows.map((row) => this.mergeSeasonPlayer(row));
  }

  async getPlayerValidationContext(playerId: number, seasonId?: string) {
    const activeSeasonId = seasonId || (await resolveReadSeasonId());
    const [player, stats, initials, transfers, allUsers] = await Promise.all([
      this.getSeasonPlayer(playerId, activeSeasonId),
      db
        .select()
        .from(playerRoundStats)
        .where(
          and(
            eq(playerRoundStats.seasonId, activeSeasonId),
            eq(playerRoundStats.playerId, playerId)
          )
        ),
      db
        .select()
        .from(initialSquads)
        .where(
          and(eq(initialSquads.seasonId, activeSeasonId), eq(initialSquads.playerId, playerId))
        ),
      db
        .select()
        .from(fichajes)
        .where(and(eq(fichajes.seasonId, activeSeasonId), eq(fichajes.playerId, playerId))),
      db
        .select({
          id: userSeasons.userId,
          name: userSeasons.name,
        })
        .from(userSeasons)
        .where(eq(userSeasons.seasonId, activeSeasonId)),
    ]);

    return { player, stats, initials, transfers, allUsers };
  }

  async getSeasonFullData(seasonId?: string) {
    const activeSeasonId = seasonId || (await resolveReadSeasonId());
    const [allPlayers, allStats, allInitial, allFichajes, allUsersList, seasonTeams] =
      await Promise.all([
        this.getSeasonPlayers(activeSeasonId),
        db.select().from(playerRoundStats).where(eq(playerRoundStats.seasonId, activeSeasonId)),
        db.select().from(initialSquads).where(eq(initialSquads.seasonId, activeSeasonId)),
        db.select().from(fichajes).where(eq(fichajes.seasonId, activeSeasonId)),
        db
          .select({
            id: userSeasons.userId,
            name: userSeasons.name,
          })
          .from(userSeasons)
          .where(eq(userSeasons.seasonId, activeSeasonId)),
        db
          .select({ id: teams.id, label: teams.name })
          .from(teams)
          .innerJoin(
            playerSeasons,
            and(eq(playerSeasons.teamId, teams.id), eq(playerSeasons.seasonId, activeSeasonId))
          )
          .groupBy(teams.id, teams.name),
      ]);

    return {
      allPlayers,
      allStats,
      allInitial,
      allFichajes,
      allUsersList,
      seasonTeams,
    };
  }
}

export const hoopgridRepository = new HoopgridRepository();
