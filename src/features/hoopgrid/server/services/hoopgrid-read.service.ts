import 'server-only';

import {
  HoopgridChallenge,
  HoopgridChallengeSummary,
  HoopgridTodayResponse,
  HoopgridGuess,
  HoopgridCheatsheetData,
  HoopgridCheatsheetSolution,
  HoopgridCriteria,
} from '../../models/hoopgrid.models';
import { validateHoopgridDateQuery } from '../../validation/hoopgrid.schema';
import { HoopgridRepository, hoopgridRepository } from '../repositories/hoopgrid.repository';
import { HoopgridCommandService, hoopgridCommandService } from './hoopgrid-command.service';

export class HoopgridReadService {
  constructor(
    private readonly repository: HoopgridRepository = hoopgridRepository,
    private readonly commandService: HoopgridCommandService = hoopgridCommandService
  ) {}

  private mapChallenge(raw: any): HoopgridChallenge {
    return {
      id: raw.id,
      gameDate: raw.gameDate,
      number: raw.number,
      rows: typeof raw.rows === 'string' ? JSON.parse(raw.rows) : raw.rows || [],
      cols: typeof raw.cols === 'string' ? JSON.parse(raw.cols) : raw.cols || [],
      possibleCounts:
        typeof raw.possibleCounts === 'string'
          ? JSON.parse(raw.possibleCounts)
          : raw.possibleCounts || [],
      complexity: this.commandService.calculateComplexity(raw.possibleCounts),
      isActive: Boolean(raw.isActive),
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : null,
    };
  }

  async getTodayChallenge(dateParam?: string, userId?: string): Promise<HoopgridTodayResponse> {
    if (dateParam) {
      validateHoopgridDateQuery({ date: dateParam });
    }
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    let challenge = await this.repository.findChallengeByDate(targetDate);

    if (!challenge) {
      const minComplexity = Math.random() < 0.2 ? 75 : 0;
      challenge = await this.commandService.getOrCreateDailyChallenge(targetDate, minComplexity);
    }

    if (!challenge) {
      throw new Error(`Failed to load or generate daily challenge for ${targetDate}`);
    }

    let userGuesses: HoopgridGuess[] = [];
    if (userId) {
      const rawGuesses = await this.repository.getUserGuesses(challenge.id, userId);

      userGuesses = await Promise.all(
        rawGuesses.map(async (g) => ({
          cellIndex: g.cellIndex,
          playerId: g.playerId,
          isCorrect: Boolean(g.isCorrect),
          playerName: g.playerName,
          playerImg: g.playerImg,
          rarity: g.playerId
            ? await this.repository.getRarity(challenge!.id, g.cellIndex, g.playerId, userId)
            : 0,
        }))
      );
    }

    return {
      challenge: this.mapChallenge(challenge),
      userGuesses,
    };
  }

  async listChallenges(): Promise<{ challenges: HoopgridChallengeSummary[] }> {
    const rawChallenges = await this.repository.listChallenges();

    const challenges: HoopgridChallengeSummary[] = rawChallenges.map((ch) => ({
      id: ch.id,
      gameDate: ch.gameDate,
      number: ch.number,
      possibleCounts: ch.possibleCounts,
      complexity: this.commandService.calculateComplexity(ch.possibleCounts),
    }));

    return { challenges };
  }

  async getCheatsheetData(dateParam?: string): Promise<HoopgridCheatsheetData | null> {
    if (dateParam) {
      validateHoopgridDateQuery({ date: dateParam });
    }
    const today = new Date().toISOString().split('T')[0];
    const targetDate = dateParam || today;

    const [challenge, { challenges: allChallenges }] = await Promise.all([
      this.repository.findChallengeByDate(targetDate),
      this.listChallenges(),
    ]);

    if (!challenge) {
      return null;
    }

    const current = new Date(targetDate);
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    const prevStr = prev.toISOString().split('T')[0];

    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0];
    const isLatest = targetDate === today;

    const rows: HoopgridCriteria[] =
      typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [];
    const cols: HoopgridCriteria[] =
      typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [];

    const { allPlayers, allStats, allInitial, allFichajes, allUsersList } =
      await this.repository.getSeasonFullData();

    const userOwnershipHistory = new Map<string, Set<number>>();
    allUsersList.forEach((u) => userOwnershipHistory.set(u.id, new Set()));
    allInitial.forEach((i) => {
      if (i.userId && i.playerId) {
        userOwnershipHistory.get(i.userId)?.add(i.playerId);
      }
    });
    allFichajes.forEach((f) => {
      if (f.comprador && f.playerId) {
        let ownerId = f.comprador;
        if (!userOwnershipHistory.has(f.comprador)) {
          const found = allUsersList.find((u) => u.name === f.comprador);
          if (found) ownerId = found.id;
        }
        userOwnershipHistory.get(ownerId)?.add(f.playerId);
      }
    });

    const everOwnedIds = new Set<number>();
    userOwnershipHistory.forEach((set) => set.forEach((id) => everOwnedIds.add(id)));

    const statsMap = new Map<number, any[]>();
    for (const s of allStats) {
      if (s.playerId) {
        if (!statsMap.get(s.playerId)) statsMap.set(s.playerId, []);
        statsMap.get(s.playerId)!.push(s);
      }
    }

    const checkCriteria = (player: any, criteria: HoopgridCriteria) => {
      const stats = statsMap.get(player.id) || [];

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
        const todayDate = new Date();
        const age =
          todayDate.getFullYear() -
          birth.getFullYear() -
          (todayDate < new Date(todayDate.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (criteria.type === 'age_min') return age >= criteria.value;
        return age <= criteria.value;
      }
      return false;
    };

    const solutions: HoopgridCheatsheetSolution[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const validPlayers = allPlayers
          .filter((p) => checkCriteria(p, rows[r]) && checkCriteria(p, cols[c]))
          .map((p) => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            price: p.price,
            img: p.img,
          }))
          .sort((a, b) => (b.price || 0) - (a.price || 0));

        solutions.push({
          rowLabel: rows[r].label,
          colLabel: cols[c].label,
          players: validPlayers,
        });
      }
    }

    return {
      challenge: this.mapChallenge(challenge),
      allChallenges,
      solutions,
      currentDate: targetDate,
      currentNumber: challenge.number || 0,
      prevDate: prevStr,
      nextDate: nextStr,
      isLatest,
    };
  }
}

export const hoopgridReadService = new HoopgridReadService();
