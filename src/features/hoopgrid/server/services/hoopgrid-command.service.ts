import 'server-only';

import crypto from 'crypto';
import {
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_COUNTRIES,
  HOOPGRID_MARKET,
  HOOPGRID_OWNERSHIP,
  HOOPGRID_HEIGHT,
  HOOPGRID_AGE,
} from '../../constants/hoopgrid-criteria';
import {
  HoopgridCriteria,
  SubmitGuessInput,
  SubmitGuessResult,
  SubmitBatchGuessesInput,
  SubmitBatchGuessesResult,
} from '../../models/hoopgrid.models';
import {
  validateSubmitGuessInput,
  validateSubmitBatchGuessesInput,
  HoopgridValidationError,
} from '../../validation/hoopgrid.schema';
import { HoopgridRepository, hoopgridRepository } from '../repositories/hoopgrid.repository';

export class HoopgridCommandService {
  constructor(private readonly repository: HoopgridRepository = hoopgridRepository) {}

  calculateComplexity(possibleCounts: number[] | string | null): number {
    if (!possibleCounts) return 0;
    const counts = typeof possibleCounts === 'string' ? JSON.parse(possibleCounts) : possibleCounts;
    if (!Array.isArray(counts) || counts.length === 0) return 0;

    const cellComplexities = counts.map((count) => {
      if (count <= 1) return 100;
      const score = 100 - Math.log2(count) * 15;
      return Math.max(1, Math.min(100, Math.round(score)));
    });

    const avg = cellComplexities.reduce((a, b) => a + b, 0) / cellComplexities.length;
    return Math.round(avg);
  }

  validateCriteriaSync(
    player: any,
    stats: any[],
    criteria: HoopgridCriteria,
    initials: any[],
    transfers: any[],
    managerName?: string
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
        const wasInInitial = initials.some((i) => i.userId === userId);
        if (wasInInitial) return true;
        return transfers.some(
          (t) => t.comprador === userId || (managerName && t.comprador === managerName)
        );
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

  hasValidMatching(cellPlayerIds: number[][]): boolean {
    const indexedCells = cellPlayerIds
      .map((ids, idx) => ({ ids, idx }))
      .sort((a, b) => a.ids.length - b.ids.length);

    const chosen = new Set<number>();

    function solve(i: number): boolean {
      if (i === 9) return true;

      const { ids } = indexedCells[i];
      for (const playerId of ids) {
        if (!chosen.has(playerId)) {
          chosen.add(playerId);
          if (solve(i + 1)) return true;
          chosen.delete(playerId);
        }
      }
      return false;
    }

    return solve(0);
  }

  async getOrCreateDailyChallenge(targetDate: string, minComplexity: number = 0) {
    const existing = await this.repository.findChallengeByDate(targetDate);
    if (existing) {
      return existing;
    }

    return await this.generateDailyChallenge(targetDate, minComplexity);
  }

  async generateDailyChallenge(
    targetDate?: string,
    minComplexity: number = 0,
    maxComplexity: number = 100
  ) {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    const pickN = (arr: any[], n: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

    let rows: HoopgridCriteria[] = [];
    let cols: HoopgridCriteria[] = [];
    let possibleCounts: number[] = [];
    let attempts = 0;

    const { allPlayers, allStats, allInitial, allFichajes, allUsersList, seasonTeams } =
      await this.repository.getSeasonFullData();

    const teamCriteria = seasonTeams
      .filter((team) => Boolean(team.label))
      .map((team) => ({ id: team.id, label: team.label as string }));

    const userOwnershipCriteria = allUsersList
      .filter((user) => Boolean(user.name))
      .flatMap((user) => [
        {
          type: 'user_ownership' as const,
          value: { userId: user.id, mode: 'current' },
          label: `Pertenece a ${user.name}`,
        },
        {
          type: 'user_ownership' as const,
          value: { userId: user.id, mode: 'past' },
          label: `Ex-jugador de ${user.name}`,
        },
      ]);

    if (teamCriteria.length < 3) {
      throw new Error('Current season has fewer than three teams available for Hoopgrid.');
    }

    const userOwnershipHistory = new Map<string, Set<number>>();
    const allUsers = Array.from(
      new Set([...allInitial.map((i) => i.userId), ...allFichajes.map((f) => f.comprador)])
    ).filter((u): u is string => !!u);

    allUsers.forEach((u) => userOwnershipHistory.set(u, new Set()));
    allInitial.forEach((i) => {
      if (i.userId && i.playerId) {
        userOwnershipHistory.get(i.userId)?.add(i.playerId);
      }
    });
    allFichajes.forEach((f) => {
      if (f.comprador && f.playerId) {
        let ownerId = f.comprador;
        if (!allUsers.includes(f.comprador)) {
          const found = allUsersList.find((u) => u.name === f.comprador);
          if (found) ownerId = found.id;
        }
        userOwnershipHistory.get(ownerId)?.add(f.playerId);
      }
    });

    const everOwnedIds = new Set<number>();
    userOwnershipHistory.forEach((set) => set.forEach((id: number) => everOwnedIds.add(id)));

    const playerStatsMap = new Map<number, any[]>();
    for (const s of allStats) {
      if (s.playerId) {
        if (!playerStatsMap.get(s.playerId)) playerStatsMap.set(s.playerId, []);
        playerStatsMap.get(s.playerId)!.push(s);
      }
    }

    const checkCriteriaInMemory = (player: any, criteria: HoopgridCriteria) => {
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

    let found = false;

    while (attempts < 1000) {
      attempts++;
      const rowPool = [...teamCriteria, ...HOOPGRID_POSITIONS];
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
        ...userOwnershipCriteria,
        ...HOOPGRID_HEIGHT,
        ...HOOPGRID_AGE,
      ];
      cols = pickN(colPool, 3).map((item) => ({
        type: item.type || 'country',
        value:
          item.value !== undefined
            ? item.value
            : { field: (item as any).field, threshold: (item as any).threshold },
        label: item.label,
      }));

      const cellPossiblePlayers: number[][] = Array.from({ length: 9 }, () => []);

      for (const player of allPlayers) {
        for (let r = 0; r < 3; r++) {
          if (!checkCriteriaInMemory(player, rows[r])) continue;
          for (let c = 0; c < 3; c++) {
            if (checkCriteriaInMemory(player, cols[c])) {
              cellPossiblePlayers[r * 3 + c].push(player.id);
            }
          }
        }
      }

      possibleCounts = cellPossiblePlayers.map((p) => p.length);

      if (possibleCounts.every((count) => count > 0)) {
        if (this.hasValidMatching(cellPossiblePlayers)) {
          found = true;
        }
      }

      if (found) {
        const finalComplexity = this.calculateComplexity(possibleCounts);
        if (finalComplexity < minComplexity || finalComplexity > maxComplexity) {
          found = false;
          continue;
        }
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Failed to generate a completable hoopgrid with minComplexity ${minComplexity} for ${dateStr} after ${attempts} attempts.`
      );
    }

    const challengeNumber = await this.repository.getNextChallengeNumber(dateStr);

    return await this.repository.insertChallengeSafely({
      id: crypto.randomUUID(),
      gameDate: dateStr,
      rows: JSON.stringify(rows),
      cols: JSON.stringify(cols),
      number: challengeNumber,
      possibleCounts: JSON.stringify(possibleCounts),
      isActive: true,
    });
  }

  async submitGuess(rawInput: unknown, userId: string): Promise<SubmitGuessResult> {
    if (!userId) {
      throw new HoopgridValidationError('Unauthorized', [{ message: 'User ID is required' }]);
    }

    const input = validateSubmitGuessInput(rawInput);

    const [challenge, context] = await Promise.all([
      this.repository.findChallengeById(input.challengeId),
      this.repository.getPlayerValidationContext(input.playerId),
    ]);

    if (!challenge || !context.player) {
      throw new Error('Data not found');
    }

    const rows: HoopgridCriteria[] =
      typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [];
    const cols: HoopgridCriteria[] =
      typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [];

    const rowCriteria = rows[Math.floor(input.cellIndex / 3)];
    const colCriteria = cols[input.cellIndex % 3];

    const userMap = new Map(context.allUsers.map((u) => [u.id, u.name]));
    const getManagerName = (crit: HoopgridCriteria) => {
      if (crit.type === 'user_ownership') return userMap.get(crit.value.userId) || undefined;
      return undefined;
    };

    const isRowCorrect = this.validateCriteriaSync(
      context.player,
      context.stats,
      rowCriteria,
      context.initials,
      context.transfers,
      getManagerName(rowCriteria)
    );

    const isColCorrect = this.validateCriteriaSync(
      context.player,
      context.stats,
      colCriteria,
      context.initials,
      context.transfers,
      getManagerName(colCriteria)
    );

    const isCorrect = isRowCorrect && isColCorrect;

    let rarity: number | null = null;
    if (isCorrect) {
      rarity = await this.repository.getRarity(
        input.challengeId,
        input.cellIndex,
        input.playerId,
        userId
      );
    }

    if (input.dryRun) {
      return {
        isCorrect,
        rarity,
        guess: {
          id: 'draft',
          challengeId: input.challengeId,
          userId,
          cellIndex: input.cellIndex,
          playerId: input.playerId,
          isCorrect,
        },
      };
    }

    const guess = await this.repository.upsertGuess({
      challengeId: input.challengeId,
      userId,
      cellIndex: input.cellIndex,
      playerId: input.playerId,
      isCorrect,
    });

    return {
      isCorrect,
      rarity,
      guess,
    };
  }

  async submitBatchGuesses(rawInput: unknown, userId: string): Promise<SubmitBatchGuessesResult> {
    if (!userId) {
      throw new HoopgridValidationError('Unauthorized', [{ message: 'User ID is required' }]);
    }

    const input = validateSubmitBatchGuessesInput(rawInput);
    const results: Array<{
      cellIndex: number;
      isCorrect: boolean;
      rarity: number | null;
      guess?: any;
    }> = [];

    for (const [cellIdxStr, p] of Object.entries(input.guesses)) {
      if (!p.isCorrect) continue;
      const cellIdx = parseInt(cellIdxStr, 10);
      const res = await this.submitGuess(
        {
          challengeId: input.challengeId,
          cellIndex: cellIdx,
          playerId: p.playerId,
          dryRun: false,
        },
        userId
      );
      results.push({ cellIndex: cellIdx, ...res });
    }

    return { success: true, results };
  }
}

export const hoopgridCommandService = new HoopgridCommandService();
