import { describe, expect, it } from 'vitest';

import type {
  TeamProfileMatchViewModel,
  TeamProfileMetricsViewModel,
} from '@/features/teams/public';

import type { PlayerDetailsQueryResult } from '../queries/player.query';
import {
  buildAdvancedStats,
  mapPlayerBirthdays,
  mapPlayerCatalogue,
  mapPlayerPerformanceSummary,
  mapPlayerProfile,
  mapPlayerRecentFormRows,
  mapPlayerRisingStars,
  mapPlayerStatLeaders,
  mapPlayerStreaks,
  mapPlayerTopPerformers,
  toPlayerProfileApiModel,
} from './player.mapper';

const details = {
  player: {
    id: '7',
    name: 'Player Seven',
    img: '/player.png',
    position: 'Base',
    price: '1000000',
    price_increment: '50000',
    team_id: '2',
    team_name: 'Madrid',
    team_code: 'MAD',
    team_img: '/team.png',
    owner_id: '3',
    owner_name: 'Manager',
    owner_color_index: '4',
    owner_icon: '/owner.png',
    points: 90,
    average: 18,
    puntos: '90',
    partidos_jugados: '5',
    played_home: '3',
    played_away: '2',
    points_home: '50',
    points_away: '40',
    points_last_season: '80',
    birth_date: '1990-01-02',
    height: '190',
    weight: '85',
    euroleague_code: 'P007',
    dorsal: '7',
    country: 'España',
    profile_url: '/players/7',
    games_played: 1,
    season_avg: 12,
    total_points: 12,
    best_real_points: 10,
    worst_real_points: 10,
    best_fantasy: 12,
    worst_fantasy: 12,
  },
  recentMatches: [
    {
      round_id: '1',
      round_name: 'Jornada 1',
      match_date: new Date('2026-10-01T18:00:00.000Z'),
      home_team: 'Madrid',
      home_img: '/team.png',
      away_team: 'Rival',
      away_img: '/rival.png',
      home_id: '2',
      away_id: '4',
      home_score: '90',
      away_score: '80',
      fantasy_points: '12',
      minutes_played: '20',
      points_scored: '10',
      rebounds: '2',
      assists: '4',
      steals: '1',
      blocks: '0',
      turnovers: '2',
      two_points_made: '2',
      two_points_attempted: '4',
      three_points_made: '1',
      three_points_attempted: '3',
      free_throws_made: '3',
      free_throws_attempted: '4',
      fouls_committed: '2',
      valuation: '11',
    },
  ],
  priceHistory: [{ date: '2026-09-01', price: '900000' }],
  transfers: [
    {
      date: '2026-09-02',
      from_name: 'Biwenger',
      to_name: 'Manager',
      amount: '0',
      from_img: null,
      to_img: '/owner.png',
      from_color: null,
      to_color: '4',
      from_id: null,
      to_id: '3',
    },
  ],
  playerTotalMatches: 1,
} as unknown as PlayerDetailsQueryResult;

const metrics = {
  matchesPlayed: 2,
  playoffProbability: 75,
} as TeamProfileMetricsViewModel;

const upcoming = [
  {
    id: 9,
    date: '2026-10-05T18:00:00.000Z',
    status: 'scheduled',
    roundName: 'Jornada 2',
    home: {
      id: 2,
      name: 'Madrid',
      code: 'MAD',
      imageUrl: '/team.png',
      score: null,
      city: null,
      arena: null,
      latitude: null,
      longitude: null,
    },
    away: {
      id: 4,
      name: 'Rival',
      code: 'RIV',
      imageUrl: '/rival.png',
      score: null,
      city: null,
      arena: null,
      latitude: null,
      longitude: null,
    },
    difficulty: 'Duro',
  },
] satisfies TeamProfileMatchViewModel[];

describe('player mappers', () => {
  it('preserves legacy nulls, decimal spelling, date serialization and field allowlists', () => {
    const source = {
      ...details,
      player: {
        ...details.player,
        name: null,
        season_avg: '12.0',
        total_points: null,
        best_real_points: null,
        worst_real_points: null,
        token: 'synthetic-secret-canary',
      },
      recentMatches: [
        { ...details.recentMatches[0], fantasy_points: null, token: 'synthetic-secret-canary' },
      ],
      priceHistory: [{ date: new Date('2026-09-01T00:00:00.000Z'), price: 900000 }],
      transfers: [{ ...details.transfers[0], from_name: null, amount: null }],
    };
    const model = mapPlayerProfile(source, metrics, upcoming);
    const wire = toPlayerProfileApiModel(model, source);
    expect(model.season_avg).toBe(12);
    expect(model.total_points).toBe(0);
    expect(wire).toMatchObject({
      name: null,
      season_avg: '12.0',
      total_points: null,
      advancedStats: { season_avg: '12.0', best_real_points: null, worst_real_points: null },
      recentMatches: [{ fantasy_points: null }],
      priceHistory: [{ date: '2026-09-01T00:00:00.000Z', price: 900000 }],
      transfers: [{ from_name: null, amount: null }],
    });
    expect(JSON.stringify(wire)).not.toContain('synthetic-secret-canary');
    expect(wire.profile_url).toBe('/players/7');
  });

  it('keeps absent season aggregates null on the wire', () => {
    const source = {
      ...details,
      player: { ...details.player, games_played: '0', season_avg: null, total_points: null },
    };
    expect(toPlayerProfileApiModel(mapPlayerProfile(source, null, []), source)).toMatchObject({
      games_played: '0',
      season_avg: null,
      total_points: null,
      advancedStats: { season_avg: null },
    });
  });

  it('normalizes catalogue and streak query values into serializable models', () => {
    const catalogue = mapPlayerCatalogue([
      {
        id: 7,
        name: 'Player',
        img: '',
        position: 'Base',
        price: 10,
        team_id: 2,
        team_name: 'Madrid',
        owner_id: 3,
        owner_name: 'Manager',
        owner_color_index: 1,
        points: 20,
        average: 4,
        total_points: 20,
      },
    ]);
    expect(catalogue[0]).toMatchObject({ id: 7, total_points: 20, avg_form_score: null });

    const streaks = mapPlayerStreaks({
      hot: [
        {
          ...catalogue[0],
          points: 20,
          games_played: 3,
          avg_points: 10,
          recent_scores: '',
        },
      ],
      cold: [],
    });
    expect(streaks.hot[0]).toMatchObject({ games: 3, recent_avg: 10 });
  });

  it('maps profile rows and cross-feature contracts without leaking Dates or numeric strings', () => {
    const profile = mapPlayerProfile(details, metrics, upcoming);
    expect(profile).toMatchObject({
      id: 7,
      price: 1000000,
      birth_date: '1990-01-02',
      profile_url: '/players/7',
      team_total_matches: 2,
      playoff_probability: 75,
      nextMatch: { difficulty: 'Duro', round_name: 'Jornada 2' },
      advancedStats: { avg_pir: 11, ast_to_ratio: 2, pts_per_40: 20 },
    });
    expect(profile.recentMatches[0].match_date).toBe('2026-10-01T18:00:00.000Z');
    expect(JSON.stringify(profile)).toContain('Player Seven');
    expect(profile.recentMatches[0].match_date).not.toBeInstanceOf(Date);
  });

  it('maps existing Dashboard and stats contracts without exposing query rows', () => {
    const row = details.player;
    expect(mapPlayerTopPerformers([row])[0]).toMatchObject({ id: 7, points: 90, average: 18 });
    expect(
      mapPlayerRecentFormRows([
        {
          ...row,
          games_played: '3',
          avg_points: '10',
          total_points: '30',
          recent_scores: '9,10,11',
          season_avg: '10',
        },
      ])[0]
    ).toMatchObject({ games_played: 3, avg_points: 10 });
    expect(
      mapPlayerRisingStars([
        { ...row, recent_avg: '14', earlier_avg: '8', improvement: '6', improvement_pct: '75' },
      ])[0]
    ).toMatchObject({ improvement: 6, improvement_pct: 75 });
    expect(
      mapPlayerBirthdays([
        {
          id: '7',
          name: 'Player Seven',
          team_id: '2',
          team_name: 'Madrid',
          team_code: 'MAD',
          position: 'Base',
          birth_date: '1990-01-02',
          owner_name: 'Manager',
          owner_color_index: '4',
        },
      ])[0]
    ).toMatchObject({ id: 7, birth_date: '1990-01-02' });
    expect(
      mapPlayerStatLeaders([
        {
          player_id: 7,
          name: 'Player Seven',
          team_id: 2,
          team_name: 'Madrid',
          team_code: 'MAD',
          owner_id: '3',
          owner_name: 'Manager',
          owner_color_index: 4,
          value: 30,
          games_played: 3,
          avg_value: 10,
        },
      ])[0]
    ).toMatchObject({ player_id: 7, games_played: '3', avg_value: 10 });
  });

  it('derives the existing performance summary from the normalized profile', () => {
    const summary = mapPlayerPerformanceSummary(mapPlayerProfile(details, metrics, upcoming));
    expect(summary).toMatchObject({
      playerId: 7,
      recentAverage: 12,
      formStatus: 'average',
      gamesPlayed: 5,
      totalPoints: 90,
    });
  });

  it('preserves aggregate string types in the existing HTTP profile contract', () => {
    const api = toPlayerProfileApiModel(mapPlayerProfile(details, metrics, upcoming), details);

    expect(api).toMatchObject({
      profile_url: '/players/7',
      games_played: '1',
      season_avg: '12',
      total_points: '12',
      advancedStats: { season_avg: '12' },
    });
    expect(Object.keys(api).sort()).toEqual(
      [
        'advancedStats',
        'best_fantasy',
        'best_real_points',
        'birth_date',
        'country',
        'dorsal',
        'euroleague_code',
        'games_played',
        'height',
        'id',
        'img',
        'name',
        'nextMatch',
        'nextMatches',
        'owner_color_index',
        'owner_icon',
        'owner_id',
        'owner_name',
        'partidos_jugados',
        'played_away',
        'played_home',
        'player_total_matches',
        'playoff_probability',
        'points_away',
        'points_home',
        'points_last_season',
        'position',
        'price',
        'priceHistory',
        'price_increment',
        'profile_url',
        'puntos',
        'recentMatches',
        'season_avg',
        'status',
        'team_code',
        'team_id',
        'team_img',
        'team_name',
        'team_total_matches',
        'total_points',
        'transfers',
        'weight',
        'worst_fantasy',
        'worst_real_points',
      ].sort()
    );
  });

  it('correctly ignores DNP matches when computing games played and averages in advanced stats', () => {
    const source = {
      ...details,
      recentMatches: [
        {
          ...details.recentMatches[0],
          round_id: '1',
          is_dnp: true,
          minutes_played: '0',
          points_scored: '0',
          valuation: '0',
        },
        {
          ...details.recentMatches[0],
          round_id: '2',
          is_dnp: false,
          minutes_played: '25',
          points_scored: '20',
          valuation: '18',
        },
      ],
    };
    const model = mapPlayerProfile(source, metrics, upcoming);
    expect(model.advancedStats.games_played).toBe(1);
    expect(model.advancedStats.avg_real_points).toBe(20);
    expect(model.advancedStats.avg_pir).toBe(18);
    expect(model.recentMatches[0].is_dnp).toBe(true);
    expect(model.recentMatches[1].is_dnp).toBe(false);
  });

  it('safely handles 0 games played by returning null for averages and rates without fabricating 0', () => {
    const source = {
      ...details,
      recentMatches: [
        {
          ...details.recentMatches[0],
          round_id: '1',
          is_dnp: true,
          minutes_played: '0',
          points_scored: '0',
          valuation: '0',
        },
      ],
    };
    const model = mapPlayerProfile(source, metrics, upcoming);
    expect(model.advancedStats.games_played).toBe(0);
    expect(model.advancedStats.avg_real_points).toBeNull();
    expect(model.advancedStats.avg_pir).toBeNull();
    expect(model.advancedStats.pts_per_40).toBeNull();
    expect(model.advancedStats.season_avg).toBeNull();
  });

  describe('buildAdvancedStats coverage and null propagation', () => {
    const baseMatch = {
      round_id: 1,
      round_name: 'Round 1',
      match_date: '2025-10-10',
      home_team: 'Home',
      home_img: '/h.png',
      away_team: 'Away',
      away_img: '/a.png',
      home_id: 1,
      away_id: 2,
      home_score: 80,
      away_score: 75,
      fantasy_points: 15,
      minutes_played: 20,
      points_scored: 10,
      rebounds: 5,
      assists: 4,
      steals: 2,
      blocks: 1,
      turnovers: 2,
      two_points_made: 3,
      two_points_attempted: 5,
      three_points_made: 1,
      three_points_attempted: 3,
      free_throws_made: 1,
      free_throws_attempted: 2,
      fouls_committed: 2,
      valuation: 12,
      is_dnp: false,
    };

    it('computes complete stats accurately when all metrics are present', () => {
      const match2 = {
        ...baseMatch,
        round_id: 2,
        points_scored: 20,
        assists: 6,
        turnovers: 1,
        valuation: 18,
      };
      const stats = buildAdvancedStats([baseMatch, match2], 15, 20, 10);
      expect(stats.games_played).toBe(2);
      expect(stats.points_scored).toBe(30);
      expect(stats.avg_real_points).toBe(15);
      expect(stats.assists).toBe(10);
      expect(stats.turnovers).toBe(3);
      expect(stats.ast_to_ratio).toBe(3.33); // 10 / 3
      expect(stats.avg_pir).toBe(15);
      expect(stats.best_real_points).toBe(20);
      expect(stats.worst_real_points).toBe(10);
    });

    it('propagates null when a sporting metric has incomplete coverage across played matches', () => {
      const matchWithMissingAssists = { ...baseMatch, round_id: 2, assists: null, turnovers: 2 };
      const stats = buildAdvancedStats([baseMatch, matchWithMissingAssists], 15, 10, 10);
      expect(stats.games_played).toBe(2);
      expect(stats.assists).toBeNull();
      expect(stats.ast_to_ratio).toBeNull();
      // Other complete metrics remain computed
      expect(stats.turnovers).toBe(4);
      expect(stats.points_scored).toBe(20);
    });

    it('returns null for ast_to_ratio when turnovers is 0 rather than dividing by zero', () => {
      const matchNoTurnovers = { ...baseMatch, turnovers: 0 };
      const stats = buildAdvancedStats([matchNoTurnovers], 10, 10, 10);
      expect(stats.turnovers).toBe(0);
      expect(stats.ast_to_ratio).toBeNull();
    });

    it('returns null for pts_per_40 when minutes_played is 0 or null', () => {
      const matchZeroMin = { ...baseMatch, minutes_played: 0, points_scored: 0 };
      const stats = buildAdvancedStats([matchZeroMin], 0, 0, 0);
      expect(stats.pts_per_40).toBeNull();
    });

    it('invalidates sporting aggregates when participation is unknown in any match', () => {
      // Round 1: known participant, assists = 5
      const round1 = {
        ...baseMatch,
        round_id: 1,
        is_dnp: false,
        assists: 5,
        turnovers: 2,
        points_scored: 10,
        minutes_played: 20,
      };
      // Round 2: unknown participation (is_dnp = null, minutes = null, assists = null)
      const round2 = {
        ...baseMatch,
        round_id: 2,
        is_dnp: null,
        minutes_played: null,
        assists: null,
        turnovers: null,
        points_scored: null,
      };

      const stats = buildAdvancedStats([round1, round2], 10, 10, 10);
      // Must NOT return assists = 5 as though coverage were complete!
      expect(stats.assists).toBeNull();
      expect(stats.points_scored).toBeNull();
      expect(stats.turnovers).toBeNull();
      expect(stats.minutes_played).toBeNull();
      expect(stats.avg_real_points).toBeNull();
      expect(stats.ast_to_ratio).toBeNull();
      expect(stats.pts_per_40).toBeNull();
    });

    it('allows complete stats when match is a known DNP (contributes 0 production and no appearance)', () => {
      const round1 = {
        ...baseMatch,
        round_id: 1,
        is_dnp: false,
        assists: 5,
        turnovers: 2,
        points_scored: 10,
        minutes_played: 20,
      };
      // Round 2: known DNP
      const round2 = {
        ...baseMatch,
        round_id: 2,
        is_dnp: true,
        minutes_played: 0,
        assists: null,
        points_scored: null,
      };

      const stats = buildAdvancedStats([round1, round2], 10, 10, 10);
      expect(stats.games_played).toBe(1);
      expect(stats.assists).toBe(5);
      expect(stats.turnovers).toBe(2);
      expect(stats.points_scored).toBe(10);
      expect(stats.avg_real_points).toBe(10);
    });
  });
});
