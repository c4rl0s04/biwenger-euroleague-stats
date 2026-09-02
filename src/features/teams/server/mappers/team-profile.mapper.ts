import type { MatchesScreenViewModel } from '@/features/matches/public';

import type {
  TeamMatchDifficulty,
  TeamProfileApiMatch,
  TeamProfileApiModel,
  TeamProfileMatchViewModel,
  TeamProfileViewModel,
  TeamRosterPlayerViewModel,
} from '../../models/team-profile';
import type { TeamProfileDetailsQueryResult, TeamRosterRow } from '../queries/team-profile.query';

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapTeamProfileDetails(
  result: TeamProfileDetailsQueryResult
): Omit<TeamProfileViewModel, 'roster' | 'upcomingMatches' | 'recentMatches'> {
  const { row } = result;
  return {
    id: toNumber(row.id),
    name: row.name || '',
    shortName: row.short_name || '',
    logoUrl: row.logo || '',
    metrics: {
      totalFantasyPoints: toNumber(row.total_fantasy_points),
      totalRealPoints: toNumber(row.total_real_points),
      averagePir: toNumber(row.avg_pir),
      totalValue: toNumber(row.total_value),
      rosterSize: toNumber(row.roster_size),
      matchesPlayed: toNumber(result.matchesPlayed),
      playoffProbability: toNumber(result.playoffProbability),
      wins: toNumber(row.wins),
      losses: toNumber(row.losses),
      rank: toNumber(result.rank),
    },
  };
}

export function mapTeamRoster(rows: TeamRosterRow[]): TeamRosterPlayerViewModel[] {
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: row.name || '',
    imageUrl: row.img || '',
    position: row.position || '',
    price: toNumber(row.price),
    priceIncrement: toNumber(row.price_increment),
    points: toNumber(row.points),
    average: toNumber(row.average),
    ownerId: row.owner_id == null ? null : toNumber(row.owner_id),
    ownerName: row.owner_name || null,
    ownerColorIndex: toNumber(row.owner_color_index),
    ownerIcon: row.owner_icon || null,
    recentScores: row.recent_scores || null,
  }));
}

interface TeamPerformance {
  homeGames: number;
  homeWins: number;
  awayGames: number;
  awayWins: number;
}

function buildPerformanceMap(matches: TeamProfileMatchViewModel[]) {
  const performance = new Map<number, TeamPerformance>();
  const entryFor = (teamId: number) => {
    const existing = performance.get(teamId);
    if (existing) return existing;
    const created = { homeGames: 0, homeWins: 0, awayGames: 0, awayWins: 0 };
    performance.set(teamId, created);
    return created;
  };

  for (const match of matches) {
    if (match.status !== 'finished' || match.home.score == null || match.away.score == null) {
      continue;
    }
    const home = entryFor(match.home.id);
    const away = entryFor(match.away.id);
    home.homeGames += 1;
    away.awayGames += 1;
    if (match.home.score > match.away.score) home.homeWins += 1;
    if (match.away.score > match.home.score) away.awayWins += 1;
  }
  return performance;
}

function matchTime(match: TeamProfileMatchViewModel): number {
  if (!match.date) return 0;
  const timestamp = new Date(match.date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function difficultyFor(
  match: TeamProfileMatchViewModel,
  teamId: number,
  performance: Map<number, TeamPerformance>
): TeamMatchDifficulty {
  const teamIsHome = match.home.id === teamId;
  const opponent = performance.get(teamIsHome ? match.away.id : match.home.id);
  const games = teamIsHome ? opponent?.awayGames : opponent?.homeGames;
  const wins = teamIsHome ? opponent?.awayWins : opponent?.homeWins;
  const winRate = games ? (wins ?? 0) / games : 0.5;
  if (winRate >= 0.6) return 'Duro';
  if (winRate < 0.4) return 'Fácil';
  return 'Normal';
}

export function mapTeamProfileMatches(
  screen: MatchesScreenViewModel,
  teamId: number,
  now: Date
): Pick<TeamProfileViewModel, 'upcomingMatches' | 'recentMatches'> {
  const matches = screen.rounds.flatMap((round) =>
    round.matches.map((match) => ({ ...match, roundName: round.roundName }))
  );
  const teamMatches = matches.filter(
    (match) => match.home.id === teamId || match.away.id === teamId
  );
  const performance = buildPerformanceMap(matches);

  const upcomingMatches = teamMatches
    .filter((match) => matchTime(match) > now.getTime())
    .sort((left, right) => matchTime(left) - matchTime(right))
    .slice(0, 3)
    .map((match) => ({
      ...match,
      difficulty: difficultyFor(match, teamId, performance),
    }));
  const recentMatches = teamMatches
    .filter((match) => match.status === 'finished')
    .sort((left, right) => matchTime(right) - matchTime(left))
    .slice(0, 5);

  return { upcomingMatches, recentMatches };
}

function toApiMatch(match: TeamProfileMatchViewModel): TeamProfileApiMatch {
  return {
    date: match.date,
    home_team: match.home.name,
    away_team: match.away.name,
    home_img: match.home.imageUrl,
    away_img: match.away.imageUrl,
    home_id: match.home.id,
    away_id: match.away.id,
    home_score: match.home.score,
    away_score: match.away.score,
    round_name: match.roundName,
    ...(match.difficulty ? { difficulty: match.difficulty } : {}),
  };
}

export function toTeamProfileApiModel(model: TeamProfileViewModel): TeamProfileApiModel {
  return {
    id: model.id,
    name: model.name,
    short_name: model.shortName,
    logo: model.logoUrl,
    total_fantasy_points: model.metrics.totalFantasyPoints,
    total_real_points: model.metrics.totalRealPoints,
    avg_pir: model.metrics.averagePir,
    total_value: model.metrics.totalValue,
    roster_size: model.metrics.rosterSize,
    matches_played: model.metrics.matchesPlayed,
    playoff_probability: model.metrics.playoffProbability,
    wins: model.metrics.wins,
    losses: model.metrics.losses,
    rank: model.metrics.rank,
    roster: model.roster.map((player) => ({
      id: player.id,
      name: player.name,
      img: player.imageUrl,
      position: player.position,
      price: player.price,
      price_increment: player.priceIncrement,
      points: player.points,
      average: player.average,
      owner_id: player.ownerId,
      owner_name: player.ownerName,
      owner_color_index: player.ownerColorIndex,
      owner_icon: player.ownerIcon,
      recent_scores: player.recentScores,
    })),
    upcomingMatches: model.upcomingMatches.map(toApiMatch),
    recentMatches: model.recentMatches.map(toApiMatch),
  };
}
