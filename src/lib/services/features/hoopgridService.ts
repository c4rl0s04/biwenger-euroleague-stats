import {
  hoopgridCommandService,
  hoopgridReadService,
  hoopgridRepository,
} from '@/features/hoopgrid/server';

export type { CriteriaType, HoopgridCriteria as Criteria } from '@/features/hoopgrid/public';

export class HoopgridService {
  static calculateComplexity(possibleCounts: number[] | string | null): number {
    return hoopgridCommandService.calculateComplexity(possibleCounts);
  }

  static async getRarity(
    challengeId: string,
    cellIndex: number,
    playerId: number,
    userId: string
  ): Promise<number> {
    return await hoopgridRepository.getRarity(challengeId, cellIndex, playerId, userId);
  }

  static async generateDailyChallenge(
    targetDate?: string,
    minComplexity: number = 0,
    maxComplexity: number = 100
  ) {
    return await hoopgridCommandService.generateDailyChallenge(
      targetDate,
      minComplexity,
      maxComplexity
    );
  }

  static async submitGuess(
    challengeId: string,
    userId: string,
    cellIndex: number,
    playerId: number,
    dryRun: boolean = false
  ) {
    return await hoopgridCommandService.submitGuess(
      { challengeId, cellIndex, playerId, dryRun },
      userId
    );
  }
}

export const hoopgridService = HoopgridService;
