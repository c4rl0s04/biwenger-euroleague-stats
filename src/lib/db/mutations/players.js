/**
 * Player Mutations (Postgres)
 * Handles Write operations for users, players, and teams tables.
 */
export function preparePlayerMutations(db) {
  return {
    // Insert/Update Player Core Data
    upsertPlayer: async (params) => {
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
          team_id=excluded.team_id,
          position=excluded.position,
          puntos=excluded.puntos,
          partidos_jugados=excluded.partidos_jugados,
          played_home=excluded.played_home,
          played_away=excluded.played_away,
          points_home=excluded.points_home,
          points_away=excluded.points_away,
          points_last_season=excluded.points_last_season,
          status=excluded.status,
          price_increment=excluded.price_increment,
          price=excluded.price
          -- img is NOT updated to preserve potentially better images
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
    },

    // Update bio data fetched from details API
    updatePlayerDetails: async (params) => {
      const sql = `
        UPDATE players 
        SET birth_date = $1, height = $2, weight = $3
        WHERE id = $4
      `;
      await db.query(sql, [params.birth_date, params.height, params.weight, params.id]);
    },

    // Insert Market Value History
    insertMarketValue: async (params) => {
      const sql = `
        INSERT INTO market_values (player_id, price, date)
        VALUES ($1, $2, $3)
        ON CONFLICT (player_id, date) DO NOTHING
      `;
      await db.query(sql, [params.player_id, params.price, params.date]);
    },

    // Get Last Market Value Date (for incremental sync)
    getLastDate: async (playerId) => {
      const res = await db.query(
        'SELECT max(date) as last_date FROM market_values WHERE player_id = $1',
        [playerId]
      );
      return res.rows[0];
    },

    // Check for missing bio data (for self-healing sync)
    getPlayerBioStatus: async (playerId) => {
      const res = await db.query('SELECT birth_date, height, weight FROM players WHERE id = $1', [
        playerId,
      ]);
      return res.rows[0]; // Returns undefined if not found, or row object
    },

    // Insert/Update Team (for Team Sync)
    upsertTeam: async (params) => {
      const sql = `
        INSERT INTO teams (id, name, short_name, img) VALUES ($1, $2, $3, $4)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name
      `;
      await db.query(sql, [params.id, params.name, params.short_name, params.img]);
    },
  };
}
