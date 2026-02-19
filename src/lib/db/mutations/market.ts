import { Pool } from 'pg';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient = Pool | {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
};

// ==========================================
// INTERFACES
// ==========================================

export interface InsertTransferParams {
  timestamp: number;
  fecha: string;
  player_id: number;
  precio: number;
  vendedor: string;
  comprador: string;
}

export interface InsertBidParams {
  transfer_id: number;
  bidder_id: string; // text in schema
  bidder_name: string;
  amount: number;
}

export interface InsertFinanceParams {
  user_id: string;
  round_id: number;
  date: string;
  type: string;
  amount: number;
  description: string;
}

export interface InsertPorraParams {
  user_id: string;
  round_id: number;
  round_name: string;
  result: string;
  aciertos: number;
}

export interface InsertPlayerFallbackParams {
  id: number;
  name: string;
  position: string;
  puntos: number;
  partidos_jugados: number;
  played_home: number;
  played_away: number;
  points_home: number;
  points_away: number;
  points_last_season: number;
}

export interface MarketMutations {
  insertTransfer: (params: InsertTransferParams) => Promise<{ id: number | null; created: boolean }>;
  insertBid: (params: InsertBidParams) => Promise<void>;
  insertFinance: (params: InsertFinanceParams) => Promise<void>;
  insertPorra: (params: InsertPorraParams) => Promise<void>;
  insertPlayerFallback: (params: InsertPlayerFallbackParams) => Promise<void>;
}

/**
 * Market & Board Mutations (Postgres)
 * Handles Write operations for transfers, finances, betting pool (porras).
 */
export function prepareMarketMutations(db: DbClient): MarketMutations {
  return {
    insertTransfer: async (params: InsertTransferParams) => {
      // Postgres: INSERT ... ON CONFLICT DO NOTHING RETURNING id
      // Since DO NOTHING prevents RETURNING from working if conflict,
      // we need to handle it.
      // If it exists, we don't need the ID because we wouldn't add bids again.
      const sql = `
        INSERT INTO fichajes (timestamp, fecha, player_id, precio, vendedor, comprador)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (timestamp, player_id, vendedor, comprador, precio) DO NOTHING
        RETURNING id
      `;
      const res = await db.query(sql, [
        params.timestamp,
        params.fecha,
        params.player_id,
        params.precio,
        params.vendedor,
        params.comprador,
      ]);

      // Mimic info object behavior: if row created, return ID.
      if (res.rowCount != null && res.rowCount > 0) {
        return { id: res.rows[0].id, created: true };
      }
      return { id: null, created: false };
    },

    insertBid: async (params: InsertBidParams) => {
      await db.query(
        'INSERT INTO transfer_bids (transfer_id, bidder_id, bidder_name, amount) VALUES ($1, $2, $3, $4)',
        [params.transfer_id, params.bidder_id, params.bidder_name, params.amount]
      );
    },

    insertFinance: async (params: InsertFinanceParams) => {
      await db.query(
        'INSERT INTO finances (user_id, round_id, date, type, amount, description) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          params.user_id,
          params.round_id,
          params.date,
          params.type,
          params.amount,
          params.description,
        ]
      );
    },

    insertPorra: async (params: InsertPorraParams) => {
      const sql = `
        INSERT INTO porras (user_id, round_id, round_name, result, aciertos)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(user_id, round_id) DO UPDATE SET
          result=excluded.result,
          aciertos=excluded.aciertos
      `;
      await db.query(sql, [
        params.user_id,
        params.round_id,
        params.round_name,
        params.result,
        params.aciertos,
      ]);
    },

    insertPlayerFallback: async (params: InsertPlayerFallbackParams) => {
      const sql = `
        INSERT INTO players (
          id, name, position, 
          puntos, partidos_jugados, 
          played_home, played_away, 
          points_home, points_away, points_last_season
        ) 
        VALUES (
          $1, $2, $3, 
          $4, $5, 
          $6, $7, 
          $8, $9, $10
        )
        ON CONFLICT(id) DO NOTHING
      `;
      await db.query(sql, [
        params.id,
        params.name,
        params.position,
        params.puntos,
        params.partidos_jugados,
        params.played_home,
        params.played_away,
        params.points_home,
        params.points_away,
        params.points_last_season,
      ]);
    },
  };
}
