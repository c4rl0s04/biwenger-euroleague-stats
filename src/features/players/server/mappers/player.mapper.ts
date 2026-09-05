import type {
  TeamProfileMatchViewModel,
  TeamProfileMetricsViewModel,
} from '@/features/teams/public';

import type {
  PlayerCatalogueItemViewModel,
  PlayerStreakItemViewModel,
  PlayerStreaksViewModel,
} from '../../models/player-catalogue';
import type {
  PlayerAdvancedStatsViewModel,
  PlayerPerformanceSummaryViewModel,
  PlayerProfileApiModel,
  PlayerProfileMatchViewModel,
  PlayerProfileViewModel,
  PlayerUpcomingMatchViewModel,
} from '../../models/player-profile';
import type {
  PlayerBirthdayViewModel,
  PlayerRecentFormViewModel,
  PlayerRisingStarViewModel,
  PlayerStatLeaderViewModel,
  PlayerTopPerformerViewModel,
} from '../../models/player-insights';
import type {
  CorePlayer,
  PlayerBirthdayRow,
  PlayerDetailsQueryResult,
  PlayerMatchRow,
  PlayerRecentForm,
  PlayerStatLeader,
  RisingStar,
} from '../queries/player.query';

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapPlayerCatalogueItem(row: CorePlayer): PlayerCatalogueItemViewModel {
  const extended = row as CorePlayer & {
    played?: number | string | null;
    best_score?: number | string | null;
    worst_score?: number | string | null;
    avg_form_score?: number | string | null;
  };
  return {
    id: toNumber(row.id),
    name: row.name || '',
    img: row.img || '',
    position: row.position || '',
    price: toNumber(row.price),
    price_increment: toNumber(row.price_increment),
    team_id: row.team_id == null ? null : toNumber(row.team_id),
    team_name: row.team_name || '',
    team_short_name: row.team_short_name || '',
    team_code: row.team_code || '',
    team_img: row.team_img || '',
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
    owner_icon: row.owner_icon || null,
    total_points: toNumber(row.total_points ?? row.points),
    played: toNumber(extended.played ?? row.played),
    average: toNumber(row.average),
    best_score: toNumber(extended.best_score ?? row.best_score),
    worst_score: toNumber(extended.worst_score ?? row.worst_score),
    recent_scores: row.recent_scores || null,
    avg_form_score: toNumber(extended.avg_form_score),
    status: row.status || null,
  };
}

export function mapPlayerCatalogue(rows: CorePlayer[]): PlayerCatalogueItemViewModel[] {
  return rows.map(mapPlayerCatalogueItem);
}

export function mapPlayerTopPerformers(rows: CorePlayer[]): PlayerTopPerformerViewModel[] {
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: row.name || '',
    img: row.img || '',
    team_id: toNullableNumber(row.team_id),
    team_name: row.team_name || '',
    team_code: row.team_code || '',
    position: row.position || '',
    price: toNumber(row.price),
    points: toNumber(row.points),
    average: toNumber(row.average),
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
    recent_scores: row.recent_scores || null,
  }));
}

export function mapPlayerRecentFormRows(rows: PlayerRecentForm[]): PlayerRecentFormViewModel[] {
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: row.name || '',
    position: row.position || '',
    img: row.img || '',
    team_id: toNullableNumber(row.team_id),
    team_name: row.team_name || '',
    team_code: row.team_code || '',
    team_img: row.team_img || '',
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
    total_points: toNumber(row.total_points),
    games_played: toNumber(row.games_played),
    avg_points: toNumber(row.avg_points),
    recent_scores: row.recent_scores || '',
  }));
}

export function mapPlayerRisingStars(rows: RisingStar[]): PlayerRisingStarViewModel[] {
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: row.name || '',
    team_id: toNullableNumber(row.team_id),
    team_name: row.team_name || '',
    team_code: row.team_code || '',
    position: row.position || '',
    recent_avg: toNumber(row.recent_avg),
    earlier_avg: toNumber(row.earlier_avg),
    improvement: toNumber(row.improvement),
    improvement_pct: toNumber(row.improvement_pct),
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
  }));
}

export function mapPlayerBirthdays(rows: PlayerBirthdayRow[]): PlayerBirthdayViewModel[] {
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: row.name || '',
    team_id: toNullableNumber(row.team_id),
    team_name: row.team_name || '',
    team_code: row.team_code || '',
    position: row.position || '',
    birth_date: row.birth_date ? String(row.birth_date) : null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
  }));
}

export function mapPlayerStatLeaders(rows: PlayerStatLeader[]): PlayerStatLeaderViewModel[] {
  return rows.map((row) => ({
    player_id: toNumber(row.player_id),
    name: row.name || '',
    team_id: toNullableNumber(row.team_id),
    team_name: row.team_name || '',
    team_code: row.team_code || '',
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
    value: toNumber(row.value),
    games_played: String(row.games_played ?? '0'),
    avg_value: toNumber(row.avg_value),
  }));
}

function mapPlayerStreak(row: PlayerRecentForm): PlayerStreakItemViewModel {
  return {
    id: toNumber(row.id),
    name: row.name || '',
    team_id: row.team_id == null ? null : toNumber(row.team_id),
    team_name: row.team_name || '',
    position: row.position || '',
    games: toNumber(row.games ?? row.games_played),
    recent_avg: toNumber(row.recent_avg ?? row.avg_points),
    season_avg: toNumber(row.season_avg),
    avg_diff: toNumber(row.avg_diff),
    trend_pct: toNumber(row.trend_pct),
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
  };
}

export function mapPlayerStreaks(rows: {
  hot: PlayerRecentForm[];
  cold: PlayerRecentForm[];
}): PlayerStreaksViewModel {
  return { hot: rows.hot.map(mapPlayerStreak), cold: rows.cold.map(mapPlayerStreak) };
}

function mapRecentMatch(row: PlayerMatchRow): PlayerProfileMatchViewModel {
  return {
    round_id: toNumber(row.round_id),
    round_name: row.round_name || '',
    match_date: serializeDate(row.match_date),
    home_team: row.home_team || '',
    home_img: row.home_img || '',
    away_team: row.away_team || '',
    away_img: row.away_img || '',
    home_id: toNumber(row.home_id),
    away_id: toNumber(row.away_id),
    home_score: toNullableNumber(row.home_score),
    away_score: toNullableNumber(row.away_score),
    fantasy_points: toNumber(row.fantasy_points),
    minutes_played: toNumber(row.minutes_played),
    points_scored: toNumber(row.points_scored),
    rebounds: toNumber(row.rebounds),
    assists: toNumber(row.assists),
    steals: toNumber(row.steals),
    blocks: toNumber(row.blocks),
    turnovers: toNumber(row.turnovers),
    two_points_made: toNumber(row.two_points_made),
    two_points_attempted: toNumber(row.two_points_attempted),
    three_points_made: toNumber(row.three_points_made),
    three_points_attempted: toNumber(row.three_points_attempted),
    free_throws_made: toNumber(row.free_throws_made),
    free_throws_attempted: toNumber(row.free_throws_attempted),
    fouls_committed: toNumber(row.fouls_committed),
    valuation: toNumber(row.valuation),
  };
}

function buildAdvancedStats(
  matches: PlayerProfileMatchViewModel[],
  seasonAverage: number,
  bestRealPoints: number,
  worstRealPoints: number
): PlayerAdvancedStatsViewModel {
  const totals = matches.reduce(
    (stats, match) => ({
      ...stats,
      two_points_made: stats.two_points_made + match.two_points_made,
      two_points_attempted: stats.two_points_attempted + match.two_points_attempted,
      three_points_made: stats.three_points_made + match.three_points_made,
      three_points_attempted: stats.three_points_attempted + match.three_points_attempted,
      free_throws_made: stats.free_throws_made + match.free_throws_made,
      free_throws_attempted: stats.free_throws_attempted + match.free_throws_attempted,
      blocks: stats.blocks + match.blocks,
      turnovers: stats.turnovers + match.turnovers,
      fouls: stats.fouls + match.fouls_committed,
      rebounds: stats.rebounds + match.rebounds,
      assists: stats.assists + match.assists,
      steals: stats.steals + match.steals,
      minutes_played: stats.minutes_played + match.minutes_played,
      points_scored: stats.points_scored + match.points_scored,
      valuation: stats.valuation + match.valuation,
      games_played: stats.games_played + (match.minutes_played ? 1 : 0),
    }),
    {
      two_points_made: 0,
      two_points_attempted: 0,
      three_points_made: 0,
      three_points_attempted: 0,
      free_throws_made: 0,
      free_throws_attempted: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      minutes_played: 0,
      points_scored: 0,
      valuation: 0,
      games_played: 0,
    }
  );
  const games = Math.max(totals.games_played, 1);
  return {
    ...totals,
    season_avg: seasonAverage,
    best_real_points: bestRealPoints,
    worst_real_points: worstRealPoints,
    avg_real_points: Number((totals.points_scored / games).toFixed(1)),
    avg_pir: Number((totals.valuation / games).toFixed(1)),
    ast_to_ratio:
      totals.turnovers > 0
        ? Number((totals.assists / totals.turnovers).toFixed(2))
        : totals.assists,
    pts_per_40:
      totals.minutes_played > 0
        ? Number(((totals.points_scored / totals.minutes_played) * 40).toFixed(1))
        : 0,
  };
}

function mapUpcomingMatch(match: TeamProfileMatchViewModel): PlayerUpcomingMatchViewModel {
  return {
    date: match.date,
    home_team: match.home.name || 'TBD',
    away_team: match.away.name || 'TBD',
    home_img: match.home.imageUrl || '',
    away_img: match.away.imageUrl || '',
    home_id: match.home.id,
    away_id: match.away.id,
    home_score: match.home.score,
    away_score: match.away.score,
    round_name: match.roundName || '',
    ...(match.difficulty ? { difficulty: match.difficulty } : {}),
  };
}

export function mapPlayerProfile(
  result: PlayerDetailsQueryResult,
  teamMetrics: TeamProfileMetricsViewModel | null,
  upcomingMatches: TeamProfileMatchViewModel[]
): PlayerProfileViewModel {
  const row = result.player;
  const recentMatches = result.recentMatches.map(mapRecentMatch);
  const seasonAverage = toNumber(row.season_avg);
  const bestRealPoints = toNumber(row.best_real_points);
  const worstRealPoints = toNumber(row.worst_real_points);
  const teamId = toNumber(row.team_id);
  const nextMatches = upcomingMatches.map(mapUpcomingMatch);

  return {
    id: toNumber(row.id),
    name: row.name || '',
    position: row.position || '',
    puntos: toNumber(row.puntos),
    partidos_jugados: toNumber(row.partidos_jugados),
    played_home: toNumber(row.played_home),
    played_away: toNumber(row.played_away),
    points_home: toNumber(row.points_home),
    points_away: toNumber(row.points_away),
    points_last_season: toNumber(row.points_last_season),
    status: row.status || null,
    price_increment: toNumber(row.price_increment),
    birth_date: row.birth_date ? String(row.birth_date) : null,
    height: toNullableNumber(row.height),
    weight: toNullableNumber(row.weight),
    price: toNumber(row.price),
    euroleague_code: row.euroleague_code || null,
    dorsal: row.dorsal || null,
    country: row.country || null,
    profile_url: row.profile_url || null,
    team_id: teamId,
    img: row.img || '',
    owner_id: row.owner_id ?? null,
    owner_name: row.owner_name || null,
    owner_color_index: toNumber(row.owner_color_index),
    owner_icon: row.owner_icon || null,
    games_played: toNumber(row.games_played),
    season_avg: seasonAverage,
    total_points: toNumber(row.total_points),
    best_real_points: bestRealPoints,
    worst_real_points: worstRealPoints,
    best_fantasy: toNumber(row.best_fantasy),
    worst_fantasy: toNumber(row.worst_fantasy),
    team_name: row.team_name || '',
    team_img: row.team_img || '',
    team_code: row.team_code || '',
    team_total_matches: teamMetrics?.matchesPlayed ?? 0,
    player_total_matches: result.playerTotalMatches,
    playoff_probability: teamMetrics?.playoffProbability ?? 0,
    recentMatches,
    priceHistory: result.priceHistory.map((point) => ({
      date: String(point.date || ''),
      price: toNumber(point.price),
    })),
    transfers: result.transfers.map((transfer) => ({
      date: String(transfer.date || ''),
      from_name: transfer.from_name || '',
      to_name: transfer.to_name || '',
      amount: toNumber(transfer.amount),
      from_img: transfer.from_img || null,
      to_img: transfer.to_img || null,
      from_color: toNullableNumber(transfer.from_color),
      to_color: toNullableNumber(transfer.to_color),
      from_id: transfer.from_id ?? null,
      to_id: transfer.to_id ?? null,
    })),
    nextMatch: nextMatches[0] || null,
    nextMatches,
    advancedStats: buildAdvancedStats(
      recentMatches,
      seasonAverage,
      bestRealPoints,
      worstRealPoints
    ),
  };
}

export function mapPlayerPerformanceSummary(
  player: PlayerProfileViewModel
): PlayerPerformanceSummaryViewModel {
  const recentGames = player.recentMatches.slice(0, 5);
  const recentAverage =
    recentGames.length > 0
      ? recentGames.reduce((sum, match) => sum + match.fantasy_points, 0) / recentGames.length
      : 0;
  const formStatus =
    recentAverage >= 20
      ? 'excellent'
      : recentAverage >= 15
        ? 'good'
        : recentAverage < 8
          ? 'poor'
          : 'average';
  return {
    playerId: player.id,
    name: player.name,
    team: player.team_name,
    recentAverage: Math.round(recentAverage * 10) / 10,
    formStatus,
    gamesPlayed: player.partidos_jugados,
    totalPoints: player.puntos,
    advancedStats: player.advancedStats,
  };
}

export function toPlayerProfileApiModel(
  player: PlayerProfileViewModel
): PlayerProfileApiModel {
  return {
    ...player,
    games_played: String(player.games_played),
    season_avg: String(player.season_avg),
    total_points: String(player.total_points),
    advancedStats: {
      ...player.advancedStats,
      season_avg: String(player.advancedStats.season_avg),
    },
  };
}
