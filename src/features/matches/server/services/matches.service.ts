import { cache } from 'react';

import { resolveRoundIdByPolicy } from '@/lib/db';

import type {
  MatchRoundScreenViewModel,
  MatchesScreenViewModel,
} from '../../models/match';
import { parseRoundId } from '../../validation/match-input';
import { mapMatchRowsToRounds } from '../mappers/match.mapper';
import { listMatchRows, type MatchListRow } from '../queries/match-list.query';

export const MATCHES_REVALIDATE_SECONDS = 300;
export const MATCHES_ACCESS_POLICY = Object.freeze({ read: 'public', mutations: 'none' } as const);

export interface MatchesServiceDependencies {
  listRows(): Promise<MatchListRow[]>;
  resolveCurrentRoundId(): Promise<number | null>;
}

export function createMatchesService(dependencies: MatchesServiceDependencies) {
  async function getMatchesScreenData(requestedRoundId?: unknown): Promise<MatchesScreenViewModel> {
    const [rows, currentRoundId] = await Promise.all([
      dependencies.listRows(),
      dependencies.resolveCurrentRoundId(),
    ]);
    const rounds = mapMatchRowsToRounds(rows);
    const requested = parseRoundId(requestedRoundId);
    const selectedRoundId =
      (requested != null && rounds.some((round) => round.roundId === requested)
        ? requested
        : null) ??
      (currentRoundId != null && rounds.some((round) => round.roundId === currentRoundId)
        ? currentRoundId
        : null) ??
      rounds[0]?.roundId ??
      null;

    return { rounds, currentRoundId, selectedRoundId };
  }

  async function getMatchRoundScreenData(roundId: unknown): Promise<MatchRoundScreenViewModel> {
    const selectedRoundId = parseRoundId(roundId);
    const screen = await getMatchesScreenData(selectedRoundId);
    return {
      selectedRoundId,
      round:
        selectedRoundId == null
          ? null
          : screen.rounds.find((entry) => entry.roundId === selectedRoundId) ?? null,
    };
  }

  return { getMatchesScreenData, getMatchRoundScreenData };
}

const matchesService = createMatchesService({
  listRows: listMatchRows,
  async resolveCurrentRoundId() {
    const value = await resolveRoundIdByPolicy('active_or_next');
    return value == null ? null : Number(value);
  },
});

// Request-scoped memoization prevents duplicate reads when sibling Server Components
// request the same screen model. Route-level revalidation remains the cross-request policy.
export const getMatchesScreenData = cache(matchesService.getMatchesScreenData);
export const getMatchRoundScreenData = cache(matchesService.getMatchRoundScreenData);
