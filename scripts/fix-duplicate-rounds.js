import { db } from '../src/lib/db/client.js';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * Normalizes round name by removing (aplazada) and trimming
 */
function normalizeRoundName(name) {
  return name.replace(/\s*\(aplazada\)\s*/i, '').trim();
}

async function fixDuplicateRounds() {
  console.log('🚀 Starting Duplicate Rounds Fix...');

  try {
    // 1. Get ALL rounds from matches table (source of truth for rounds)
    // We group by "round_id" to see what rounds exist
    const roundsRes = await db.query(`
      SELECT DISTINCT round_id, round_name 
      FROM matches 
      ORDER BY round_id
    `);

    const rounds = roundsRes.rows;
    console.log(`Found ${rounds.length} total rounds active in matches.`);

    // 2. Group by Normalized Name
    const map = new Map(); // "Jornada 5" -> [ { id: 5, name: "Jornada 5" }, { id: 55, name: "Jornada 5 (aplazada)" } ]

    for (const r of rounds) {
      const baseName = normalizeRoundName(r.round_name);
      if (!map.has(baseName)) {
        map.set(baseName, []);
      }
      map.get(baseName).push(r);
    }

    // 3. Process Duplicates
    let totalMerged = 0;

    for (const [baseName, group] of map.entries()) {
      if (group.length > 1) {
        // Sort by ID ascending (Assumption: Lower ID is the original/main round)
        group.sort((a, b) => a.round_id - b.round_id);

        const canonical = group[0];
        const duplicates = group.slice(1);

        console.log(`\n🔹 Processing group: "${baseName}"`);
        console.log(`   Canonical: ID ${canonical.round_id} (${canonical.round_name})`);

        for (const dup of duplicates) {
          console.log(`   👉 Merging Duplicate: ID ${dup.round_id} (${dup.round_name})...`);

          await mergeRound(dup.round_id, canonical.round_id);
          totalMerged++;
        }
      }
    }

    console.log(`\n✅ Fix Complete! Merged ${totalMerged} duplicate rounds.`);
  } catch (err) {
    console.error('❌ Error fixing duplicates:', err);
  } finally {
    await db.end();
  }
}

async function mergeRound(sourceId, targetId) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Matches: Move matches to target round
    // If a match (home_id + away_id) already exists in target (rare but possible if re-synced),
    // we need to handle conflict. For simplicity, we UPDATE source matches to target_id
    // and rely on ON CONFLICT DO NOTHING / UPDATE or manually handle it.
    // Since `round_id` is part of the unique key in matches, simple UPDATE might fail if collision.

    // Check for collisions first
    const sourceMatches = (
      await client.query('SELECT * FROM matches WHERE round_id = $1', [sourceId])
    ).rows;

    for (const m of sourceMatches) {
      // Upsert logic: Delete from source, Insert/Update into target
      // We act like we are "moving" it.

      // Delete old record
      await client.query('DELETE FROM matches WHERE id = $1', [m.id]); // Delete by PK

      // Insert into new round (Upsert style)
      // We reuse the mutation logic simplified here
      const sql = `
            INSERT INTO matches (
                round_id, round_name, home_id, away_id, date, status, 
                home_score, away_score, home_score_regtime, away_score_regtime,
                home_q1, away_q1, home_q2, away_q2, home_q3, away_q3, home_q4, away_q4, home_ot, away_ot
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            ON CONFLICT(round_id, home_id, away_id) DO UPDATE SET
                status=excluded.status,
                home_score=excluded.home_score,
                away_score=excluded.away_score,
                date=excluded.date
        `;

      await client.query(sql, [
        targetId,
        m.round_name,
        m.home_id,
        m.away_id,
        m.date,
        m.status,
        m.home_score,
        m.away_score,
        m.home_score_regtime,
        m.away_score_regtime,
        m.home_q1,
        m.away_q1,
        m.home_q2,
        m.away_q2,
        m.home_q3,
        m.away_q3,
        m.home_q4,
        m.away_q4,
        m.home_ot,
        m.away_ot,
      ]);
    }

    // 2. Player Round Stats: Move stats
    // Update round_id. If collision (player already has stats in target round),
    // we usually favor the "source" one if it's the postponed match (latest data),
    // OR we might want to keep existing.
    // Safe bet: DELETE source rows that collide, keep target. UPDATE source rows that don't collide.

    // 2a. Delete colliding rows in source (players that already have stats in target round)
    await client.query(
      `
        DELETE FROM player_round_stats 
        WHERE round_id = $1 
        AND player_id IN (SELECT player_id FROM player_round_stats WHERE round_id = $2)
    `,
      [sourceId, targetId]
    );

    // 2b. Move remaining rows
    await client.query(
      `
        UPDATE player_round_stats 
        SET round_id = $2 
        WHERE round_id = $1
    `,
      [sourceId, targetId]
    );

    // 3. User Rounds: Merge points
    // Add source points to target points, then delete source
    await client.query(
      `
        UPDATE user_rounds ur_target
        SET points = points + (
            SELECT points FROM user_rounds ur_source 
            WHERE ur_source.user_id = ur_target.user_id 
            AND ur_source.round_id = $1
        )
        WHERE round_id = $2
        AND EXISTS (
             SELECT 1 FROM user_rounds ur_source 
             WHERE ur_source.user_id = ur_target.user_id 
             AND ur_source.round_id = $1
        )
    `,
      [sourceId, targetId]
    );

    // Now delete the source user_rounds (ones we merged + ones we didn't merge but need to move?)
    // Actually, checking "on conflict" for users who didn't participate in target but did in source
    // It's safer to just delete source rows that collide, and UPDATE unique ones.

    await client.query(
      `
        DELETE FROM user_rounds 
        WHERE round_id = $1 
        AND user_id IN (SELECT user_id FROM user_rounds WHERE round_id = $2)
    `,
      [sourceId, targetId]
    );

    await client.query(
      `
        UPDATE user_rounds 
        SET round_id = $2 
        WHERE round_id = $1
    `,
      [sourceId, targetId]
    );

    // 4. Lineups: Same logic
    await client.query(
      `
        DELETE FROM lineups 
        WHERE round_id = $1 
        AND user_id IN (SELECT user_id FROM lineups WHERE round_id = $2)
    `,
      [sourceId, targetId]
    );

    await client.query(
      `
        UPDATE lineups 
        SET round_id = $2 
        WHERE round_id = $1
    `,
      [sourceId, targetId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

fixDuplicateRounds();
