import { db } from '../client';

// ==========================================
// INTERFACES
// ==========================================

export interface UpsertTournamentParams {
  id: number;
  league_id: number;
  name: string;
  type: string;
  status: string;
  data_json: string | null;
  updated_at: number;
}

export interface UpsertPhaseParams {
  tournament_id: number;
  name: string;
  type: string;
  order_index: number;
}

export interface UpsertFixtureParams {
  id: number;
  tournament_id: number;
  phase_id: number | null;
  round_name: string | null;
  round_id: number | null;
  group_name: string | null;
  home_user_id: string | null; // text in schema
  away_user_id: string | null; // text in schema
  home_score: number | null;
  away_score: number | null;
  date: number | null; // stored as integer in schema for fixtures
  status: string | null;
}

export interface UpsertStandingParams {
  tournament_id: number;
  phase_name: string | null;
  group_name: string | null;
  user_id: string | null; // text in schema
  position: number | null;
  points: number | null;
  won: number | null;
  lost: number | null;
  drawn: number | null;
  scored: number | null;
  against: number | null;
}

// ==========================================
// MUTATIONS
// ==========================================

export async function upsertTournament(tournament: UpsertTournamentParams): Promise<void> {
  const { id, league_id, name, type, status, data_json, updated_at } = tournament;

  await db.query(
    `
    INSERT INTO tournaments (id, league_id, name, type, status, data_json, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT(id) DO UPDATE SET
      league_id = EXCLUDED.league_id,
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      data_json = EXCLUDED.data_json,
      updated_at = EXCLUDED.updated_at
  `,
    [id, league_id, name, type, status, data_json, updated_at]
  );
}

export async function upsertPhase(phase: UpsertPhaseParams): Promise<number> {
  const { tournament_id, name, type, order_index } = phase;

  // Note: We don't have a stable ID from API for phases usually,
  // but we have a unique constraint on (tournament_id, order_index).
  // Check if we need to return the ID.
  const res = await db.query(
    `
    INSERT INTO tournament_phases (tournament_id, name, type, order_index)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(tournament_id, order_index) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type
    RETURNING id
  `,
    [tournament_id, name, type, order_index]
  );

  return res.rows[0].id; // RETURNING clause ensures we get the ID
}

export async function upsertFixture(fixture: UpsertFixtureParams): Promise<void> {
  const {
    id,
    tournament_id,
    phase_id,
    round_name,
    round_id,
    group_name,
    home_user_id,
    away_user_id,
    home_score,
    away_score,
    date,
    status,
  } = fixture;

  await db.query(
    `
    INSERT INTO tournament_fixtures (
      id, tournament_id, phase_id, 
      round_name, round_id, group_name, 
      home_user_id, away_user_id, 
      home_score, away_score, 
      date, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT(id) DO UPDATE SET
      phase_id = EXCLUDED.phase_id,
      round_name = EXCLUDED.round_name,
      round_id = EXCLUDED.round_id,
      group_name = EXCLUDED.group_name,
      home_user_id = EXCLUDED.home_user_id,
      away_user_id = EXCLUDED.away_user_id,
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      date = EXCLUDED.date,
      status = EXCLUDED.status
  `,
    [
      id,
      tournament_id,
      phase_id,
      round_name,
      round_id,
      group_name,
      home_user_id,
      away_user_id,
      home_score,
      away_score,
      date,
      status,
    ]
  );
}

export async function upsertStanding(standing: UpsertStandingParams): Promise<void> {
  const {
    tournament_id,
    phase_name,
    group_name,
    user_id,
    position,
    points,
    won,
    lost,
    drawn,
    scored,
    against,
  } = standing;

  await db.query(
    `
    INSERT INTO tournament_standings (
      tournament_id, phase_name, group_name, user_id,
      position, points, won, lost, drawn, scored, against
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT(tournament_id, phase_name, group_name, user_id) DO UPDATE SET
      position = EXCLUDED.position,
      points = EXCLUDED.points,
      won = EXCLUDED.won,
      lost = EXCLUDED.lost,
      drawn = EXCLUDED.drawn,
      scored = EXCLUDED.scored,
      against = EXCLUDED.against
  `,
    [
      tournament_id,
      phase_name,
      group_name,
      user_id,
      position,
      points,
      won,
      lost,
      drawn,
      scored,
      against,
    ]
  );
}
