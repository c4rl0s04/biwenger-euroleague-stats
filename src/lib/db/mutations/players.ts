import { Pool } from 'pg';
import { CONFIG } from '../../config';
import { DEFAULT_SEASON_ID } from '../schema';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient =
  | Pool
  | {
      query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
    };

// ==========================================
// INTERFACES
// ==========================================

export interface UpsertPlayerParams {
  id: number;
  name: string;
  team_id: number;
  position: string;
  puntos: number;
  partidos_jugados: number;
  played_home: number;
  played_away: number;
  points_home: number;
  points_away: number;
  points_last_season: number;
  status: string;
  price_increment: number;
  price: number;
  img: string;
}

export interface UpdatePlayerDetailsParams {
  birth_date: string;
  height: number;
  weight: number;
  id: number; // biwenger_id
}

export interface InsertMarketValueParams {
  player_id: number;
  price: number;
  date: string;
}

export interface UpsertTeamParams {
  id: number;
  name: string;
  short_name: string;
  img: string;
}

export interface PlayerMutations {
  upsertPlayer: (params: UpsertPlayerParams) => Promise<void>;
  updatePlayerDetails: (params: UpdatePlayerDetailsParams) => Promise<void>;
  insertMarketValue: (params: InsertMarketValueParams) => Promise<void>;
  getLastDate: (playerId: number) => Promise<{ last_date: Date | string } | undefined>;
  getPlayerBioStatus: (
    playerId: number
  ) => Promise<{ birth_date: string; height: number; weight: number } | undefined>;
  upsertTeam: (params: UpsertTeamParams) => Promise<void>;
}

export interface PlayerMutationOptions {
  seasonId?: string;
}

/**
 * Player Mutations (Postgres)
 * Handles Write operations for users, players, and teams tables.
 */
export function preparePlayerMutations(
  db: DbClient,
  options: PlayerMutationOptions = {}
): PlayerMutations {
  const seasonId = options.seasonId ?? CONFIG.SEASON.ID;

  return {
    // Insert/Update Player Core Data
    upsertPlayer: async (params: UpsertPlayerParams) => {
      if (seasonId === DEFAULT_SEASON_ID) {
        const sql = `
          INSERT INTO players (
            id, name, team_id, position,
            puntos, partidos_jugados,
            played_home, played_away,
            points_home, points_away, points_last_season,
            status, price_increment, price, img
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6,
            $7, $8,
            $9, $10,
            $11,
            $12, $13, $14, $15
          )
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            position=excluded.position,
            puntos = GREATEST(players.puntos, excluded.puntos),
            partidos_jugados = GREATEST(players.partidos_jugados, excluded.partidos_jugados),
            played_home = GREATEST(players.played_home, excluded.played_home),
            played_away = GREATEST(players.played_away, excluded.played_away),
            points_home = GREATEST(players.points_home, excluded.points_home),
            points_away = GREATEST(players.points_away, excluded.points_away),
            points_last_season = GREATEST(players.points_last_season, excluded.points_last_season),
            -- players.price is a latest-price cache. Historical peaks/decrements live in market_values.
            price = excluded.price,
            status = excluded.status,
            price_increment = excluded.price_increment,
            -- COALESCE: never overwrite existing team_id or img with incoming data if already set
            team_id = COALESCE(players.team_id, excluded.team_id),
            img = COALESCE(players.img, excluded.img)
        `;
        const values = [
          params.id,
          params.name,
          params.team_id,
          params.position,
          params.puntos,
          params.partidos_jugados,
          params.played_home,
          params.played_away,
          params.points_home,
          params.points_away,
          params.points_last_season,
          params.status,
          params.price_increment,
          params.price,
          params.img,
        ];
        await db.query(sql, values);
      } else {
        await db.query(
          `
          INSERT INTO players (id, name, position, img)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT(id) DO NOTHING
        `,
          [params.id, params.name, params.position, params.img]
        );
      }

      await db.query(
        `
        INSERT INTO player_seasons (
          season_id, player_id, team_id,
          puntos, partidos_jugados,
          played_home, played_away,
          points_home, points_away, points_last_season,
          status, price_increment, price, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT(season_id, player_id) DO UPDATE SET
          team_id = COALESCE(player_seasons.team_id, excluded.team_id),
          puntos = GREATEST(player_seasons.puntos, excluded.puntos),
          partidos_jugados = GREATEST(player_seasons.partidos_jugados, excluded.partidos_jugados),
          played_home = GREATEST(player_seasons.played_home, excluded.played_home),
          played_away = GREATEST(player_seasons.played_away, excluded.played_away),
          points_home = GREATEST(player_seasons.points_home, excluded.points_home),
          points_away = GREATEST(player_seasons.points_away, excluded.points_away),
          points_last_season = GREATEST(player_seasons.points_last_season, excluded.points_last_season),
          status = excluded.status,
          price_increment = excluded.price_increment,
          price = excluded.price,
          updated_at = NOW()
      `,
        [
          seasonId,
          params.id,
          params.team_id,
          params.puntos,
          params.partidos_jugados,
          params.played_home,
          params.played_away,
          params.points_home,
          params.points_away,
          params.points_last_season,
          params.status,
          params.price_increment,
          params.price,
        ]
      );
    },

    // Update bio data fetched from details API
    updatePlayerDetails: async (params: UpdatePlayerDetailsParams) => {
      const sql = `
        UPDATE players
        SET birth_date = $1, height = $2, weight = $3
        WHERE id = $4
      `;
      await db.query(sql, [params.birth_date, params.height, params.weight, params.id]);
    },

    // Insert Market Value History
    insertMarketValue: async (params: InsertMarketValueParams) => {
      const sql = `
        INSERT INTO market_values (season_id, player_id, price, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (season_id, player_id, date) DO NOTHING
      `;
      await db.query(sql, [seasonId, params.player_id, params.price, params.date]);
    },

    // Get Last Market Value Date (for incremental sync)
    getLastDate: async (playerId: number) => {
      const res = await db.query(
        'SELECT max(date) as last_date FROM market_values WHERE season_id = $1 AND player_id = $2',
        [seasonId, playerId]
      );
      return res.rows[0];
    },

    // Check for missing bio data (for self-healing sync)
    getPlayerBioStatus: async (playerId: number) => {
      const res = await db.query('SELECT birth_date, height, weight FROM players WHERE id = $1', [
        playerId,
      ]);
      return res.rows[0]; // Returns undefined if not found, or row object
    },

    // Insert/Update Team (for Team Sync)
    upsertTeam: async (params: UpsertTeamParams) => {
      const sql =
        seasonId === DEFAULT_SEASON_ID
          ? `
            INSERT INTO teams (id, name, short_name, img)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              short_name=excluded.short_name,
              img=COALESCE(teams.img, excluded.img)
          `
          : `
            INSERT INTO teams (id, name, short_name, img)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(id) DO NOTHING
          `;
      await db.query(sql, [params.id, params.name, params.short_name, params.img]);
    },
  };
}
