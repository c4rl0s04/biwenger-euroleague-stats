import type {
  Tournament,
  TournamentStanding,
  TournamentFixture,
  ManagerTournamentRead,
  TournamentJson,
} from '../../models/tournaments';
import type {
  TournamentRecord,
  TournamentStandingRecord,
  TournamentFixtureRecord,
  ManagerTournamentRecord,
} from '../queries/tournament.records';

const color = (value: string | number | null | undefined) =>
  value !== null && value !== undefined ? parseInt(String(value)) : null;

export function mapTournament(row: TournamentRecord): Tournament {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    data_json: row.data_json,
    // Parsing errors deliberately propagate for list/detail reads, as before.
    data: row.data_json ? (JSON.parse(row.data_json) as TournamentJson) : null,
  };
}

export function mapTournamentStanding(row: TournamentStandingRecord): TournamentStanding {
  return {
    id: row.id,
    season_id: row.season_id,
    tournament_id: row.tournament_id,
    phase_name: row.phase_name,
    group_name: row.group_name,
    user_id: row.user_id,
    position: row.position,
    points: row.points,
    won: row.won,
    lost: row.lost,
    drawn: row.drawn,
    scored: row.scored,
    against: row.against,
    user_name: row.user_name,
    user_icon: row.user_icon,
    user_color: color(row.user_color),
  };
}

export function mapTournamentFixture(row: TournamentFixtureRecord): TournamentFixture {
  return {
    id: row.id,
    tournament_id: row.tournament_id,
    phase_id: row.phase_id,
    round_name: row.round_name,
    round_id: row.round_id,
    group_name: row.group_name,
    home_user_id: row.home_user_id,
    away_user_id: row.away_user_id,
    home_score: row.home_score,
    away_score: row.away_score,
    date: row.date,
    status: row.status,
    phase_name: row.phase_name,
    phase_type: row.phase_type,
    home_user_name: row.home_user_name,
    home_user_icon: row.home_user_icon,
    home_user_color: color(row.home_user_color),
    away_user_name: row.away_user_name,
    away_user_icon: row.away_user_icon,
    away_user_color: color(row.away_user_color),
  };
}

export function mapManagerTournament(row: ManagerTournamentRecord): ManagerTournamentRead {
  return {
    tournament_id: row.tournament_id,
    tournament_name: row.tournament_name,
    tournament_type: row.tournament_type,
    tournament_status: row.tournament_status,
    data_json: row.data_json,
    position: row.position ? parseInt(String(row.position)) : null,
    points: row.points ? parseInt(String(row.points)) : null,
    won: row.won ? parseInt(String(row.won)) : 0,
    drawn: row.drawn ? parseInt(String(row.drawn)) : 0,
    lost: row.lost ? parseInt(String(row.lost)) : 0,
    phase_name: row.phase_name,
    group_name: row.group_name,
  };
}
