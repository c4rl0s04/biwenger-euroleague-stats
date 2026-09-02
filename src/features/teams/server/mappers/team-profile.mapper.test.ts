import { describe, expect, it } from 'vitest';

import type { MatchesScreenViewModel, MatchScheduleViewModel } from '@/features/matches/public';

import type { TeamProfileDetailsQueryResult, TeamRosterRow } from '../queries/team-profile.query';
import {
  mapTeamProfileDetails,
  mapTeamProfileMatches,
  mapTeamRoster,
  toTeamProfileApiModel,
} from './team-profile.mapper';

const details = {
  row: {
    id: '7',
    name: 'Madrid',
    short_name: 'MAD',
    logo: '/madrid.png',
    total_fantasy_points: '1234',
    total_real_points: '987',
    avg_pir: '82.5',
    total_value: '4000000',
    roster_size: '2',
    wins: '3',
    losses: '1',
  },
  matchesPlayed: 4,
  playoffProbability: 84,
  rank: '2',
} satisfies TeamProfileDetailsQueryResult;

const roster = [
  {
    id: '10',
    name: 'Player',
    img: '/player.png',
    position: 'Base',
    price: '1000000',
    price_increment: '25000',
    points: '120',
    average: '15.5',
    owner_id: '3',
    owner_name: 'Owner',
    owner_color_index: '2',
    owner_icon: 'star',
    recent_scores: '10,20',
  },
] satisfies TeamRosterRow[];

const matchScreen: MatchesScreenViewModel = {
  currentRoundId: 4,
  selectedRoundId: 4,
  rounds: [
    {
      roundId: 3,
      roundIndex: 3,
      roundName: 'Jornada 3',
      matches: [
        {
          id: 30,
          date: '2026-08-20T18:00:00.000Z',
          status: 'finished',
          home: {
            id: 8,
            name: 'Strong home',
            code: 'SHO',
            imageUrl: '/strong.png',
            score: 90,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
          away: {
            id: 9,
            name: 'Other',
            code: 'OTH',
            imageUrl: '/other.png',
            score: 70,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
        },
        {
          id: 31,
          date: '2026-08-25T18:00:00.000Z',
          status: 'finished',
          home: {
            id: 8,
            name: 'Strong home',
            code: 'SHO',
            imageUrl: '/strong.png',
            score: 88,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
          away: {
            id: 7,
            name: 'Madrid',
            code: 'MAD',
            imageUrl: '/madrid.png',
            score: 80,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
        },
      ],
    },
    {
      roundId: 5,
      roundIndex: 5,
      roundName: 'Jornada 5',
      matches: [
        {
          id: 50,
          date: '2026-09-10T18:00:00.000Z',
          status: 'scheduled',
          home: {
            id: 8,
            name: 'Strong home',
            code: 'SHO',
            imageUrl: '/strong.png',
            score: null,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
          away: {
            id: 7,
            name: 'Madrid',
            code: 'MAD',
            imageUrl: '/madrid.png',
            score: null,
            city: null,
            arena: null,
            latitude: null,
            longitude: null,
          },
        },
      ],
    },
  ],
};

const schedule = matchScreen.rounds.flatMap((round) =>
  round.matches.map((match) => ({ ...match, roundName: round.roundName }))
) satisfies MatchScheduleViewModel[];

describe('team profile mappers', () => {
  it('normalizes database-shaped details and roster rows into serializable models', () => {
    const model = {
      ...mapTeamProfileDetails(details),
      roster: mapTeamRoster(roster),
      upcomingMatches: [],
      recentMatches: [],
    };

    expect(model).toMatchObject({
      id: 7,
      shortName: 'MAD',
      logoUrl: '/madrid.png',
      metrics: { totalFantasyPoints: 1234, averagePir: 82.5, rank: 2 },
      roster: [{ id: 10, imageUrl: '/player.png', ownerId: 3, average: 15.5 }],
    });
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
  });

  it('derives Team-owned recent, upcoming and difficulty projections from Matches models', () => {
    const result = mapTeamProfileMatches(
      [...schedule, { ...schedule[1], id: 32, date: null, roundName: '' }],
      7,
      new Date('2026-09-02T12:00:00.000Z')
    );

    expect(result.recentMatches.map((match) => match.id)).toEqual([31, 32]);
    expect(result.recentMatches[1]).toMatchObject({
      roundName: '',
      date: '2026-09-02T12:00:00.000Z',
    });
    expect(result.upcomingMatches).toMatchObject([
      { id: 50, roundName: 'Jornada 5', difficulty: 'Duro' },
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('preserves the existing snake_case HTTP payload while hiding database records internally', () => {
    const matchProjection = mapTeamProfileMatches(
      schedule,
      7,
      new Date('2026-09-02T12:00:00.000Z')
    );
    const api = toTeamProfileApiModel({
      ...mapTeamProfileDetails(details),
      roster: mapTeamRoster(roster),
      ...matchProjection,
    });

    expect(api).toMatchObject({
      short_name: 'MAD',
      total_fantasy_points: 1234,
      roster: [{ owner_id: 3, recent_scores: '10,20' }],
      upcomingMatches: [{ home_team: 'Strong home', round_name: 'Jornada 5' }],
    });
    expect(api).not.toHaveProperty('metrics');
    expect(api.roster[0]).not.toHaveProperty('ownerId');
  });
});
