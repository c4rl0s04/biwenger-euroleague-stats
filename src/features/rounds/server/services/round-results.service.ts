import 'server-only';
import type {
  RoundCompleteViewModel,
  RoundStandingViewModel,
  RoundUserDetailsViewModel,
} from '../../models/round-read';
import {
  hasOfficialStats,
  getOfficialStandings,
  getLivingStandings,
  getCoachRating,
  getRoundGlobalStats,
  getIdealLineup,
  getUserLineup,
  getPlayersLeftOut,
  getUserOptimization,
} from '../queries/round-analysis.query';
import {
  mapRoundStanding,
  mapRoundGlobal,
  mapRoundIdeal,
  mapRoundLineup,
  mapRoundCoach,
  mapRoundCandidate,
  mapRoundOptimization,
} from '../mappers/round-read.mapper';

export interface RoundResultsDependencies {
  official: typeof hasOfficialStats;
  officialStandings: typeof getOfficialStandings;
  liveStandings: typeof getLivingStandings;
  coach: typeof getCoachRating;
  global: typeof getRoundGlobalStats;
  ideal: typeof getIdealLineup;
  lineup: typeof getUserLineup;
  leftOut: typeof getPlayersLeftOut;
  optimization: typeof getUserOptimization;
}
export function createRoundResultsService(deps: RoundResultsDependencies) {
  async function fetchRoundStandings(roundId: string | number): Promise<RoundStandingViewModel[]> {
    if (!roundId) return [];
    const official = await deps.official(roundId);
    const standings = await (official
      ? deps.officialStandings(roundId)
      : deps.liveStandings(roundId));
    return Promise.all(
      standings.map(async (user) => {
        try {
          const rating = await deps.coach(user.id, roundId);
          return mapRoundStanding(user, Math.round(rating?.maxScore || 0));
        } catch (e) {
          console.error(`Failed to calc ideal for user ${user.id}`, e);
          return mapRoundStanding(user, 0);
        }
      })
    );
  }
  async function fetchRoundCompleteData(
    roundId: string | number,
    filterUserId?: string | number,
    excludeUserId?: string | number
  ): Promise<RoundCompleteViewModel | null> {
    if (!roundId) return null;
    const [global, idealResult, standings] = await Promise.all([
      deps.global(roundId),
      deps.ideal(roundId),
      fetchRoundStandings(roundId),
    ]);
    const ideal = mapRoundIdeal(idealResult);
    let usersToFetch = standings || [];
    if (filterUserId && usersToFetch.length > 0) {
      usersToFetch = usersToFetch.filter((u) => String(u.id) === String(filterUserId));
    } else if (excludeUserId && usersToFetch.length > 0) {
      usersToFetch = usersToFetch.filter((u) => String(u.id) !== String(excludeUserId));
    }
    const users = await Promise.all(
      usersToFetch.map(async (user) => {
        try {
          const [lineup, rating, leftOut] = await Promise.all([
            deps.lineup(String(user.id), String(roundId)),
            deps.coach(String(user.id), String(roundId)),
            deps.leftOut(String(user.id), String(roundId)),
          ]);
          const coachRating = mapRoundCoach(rating);
          return {
            ...user,
            lineup: mapRoundLineup(lineup),
            idealLineup: coachRating?.idealLineup || [],
            coachRating,
            leftOut: (leftOut || []).map(mapRoundCandidate),
          };
        } catch (e) {
          console.error(`Error fetching details for user ${user.id}`, e);
          return user;
        }
      })
    );
    return {
      global: mapRoundGlobal(global),
      idealLineup: ideal.idealLineup,
      globalIdealPoints: ideal.totalPoints,
      users,
    };
  }
  async function fetchUserLineup(userId: string | number, roundId: string | number) {
    return mapRoundLineup(await deps.lineup(String(userId), String(roundId)));
  }
  async function fetchUserRoundDetails(
    roundId: string | number,
    userId?: string | number
  ): Promise<RoundUserDetailsViewModel> {
    const [global, ideal, stats, leftOut, rating] = await Promise.all([
      deps.global(roundId),
      deps.ideal(roundId),
      userId ? deps.optimization(String(userId), String(roundId)) : null,
      userId ? deps.leftOut(String(userId), String(roundId)) : [],
      userId ? deps.coach(String(userId), String(roundId)) : null,
    ]);
    const coachRating = mapRoundCoach(rating);
    return {
      global: mapRoundGlobal(global),
      idealLineup: mapRoundIdeal(ideal),
      user: {
        ...(stats ? mapRoundOptimization(stats) : {}),
        coachRating,
        idealLineup: coachRating?.idealLineup,
        leftOut: leftOut.map(mapRoundCandidate),
      },
    };
  }
  return { fetchRoundStandings, fetchRoundCompleteData, fetchUserLineup, fetchUserRoundDetails };
}
export const {
  fetchRoundStandings,
  fetchRoundCompleteData,
  fetchUserLineup,
  fetchUserRoundDetails,
} = createRoundResultsService({
  official: hasOfficialStats,
  officialStandings: getOfficialStandings,
  liveStandings: getLivingStandings,
  coach: getCoachRating,
  global: getRoundGlobalStats,
  ideal: getIdealLineup,
  lineup: getUserLineup,
  leftOut: getPlayersLeftOut,
  optimization: getUserOptimization,
});
