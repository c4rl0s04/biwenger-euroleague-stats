import { db } from './src/lib/db/client.js';

async function debugView() {
  console.log('🔍 Generating Tournament Report...\n');

  try {
    // 1. Get all tournaments
    const tournaments = await db.query('SELECT * FROM tournaments ORDER BY id');

    if (tournaments.rows.length === 0) {
      console.log('No tournaments found.');
      return;
    }

    for (const t of tournaments.rows) {
      console.log(`\n==================================================`);
      console.log(`🏆 TOURNAMENT: ${t.name} (ID: ${t.id})`);
      console.log(`   Type: ${t.type} | Status: ${t.status}`);
      console.log(`==================================================\n`);

      // 2. Standings
      const standings = await db.query(
        `
            SELECT 
                phase_name as Phase,
                group_name as Grp,
                position as Pos,
                u.name as Team,
                points as Pts,
                won as W,
                lost as L,
                drawn as D,
                scored as PF,
                against as PA
            FROM tournament_standings ts
            LEFT JOIN users u ON ts.user_id = u.id
            WHERE tournament_id = $1
            ORDER BY phase_name, group_name, position
        `,
        [t.id]
      );

      if (standings.rows.length > 0) {
        console.log(`📊 STANDINGS`);
        console.table(standings.rows);
      } else {
        console.log(`(No standings data available for this tournament type)`);
      }

      // 3. Fixtures (Grouped by Round)
      const fixtures = await db.query(
        `
            SELECT 
                tf.round_name,
                tf.phase_id,
                tp.name as phase_name,
                tf.group_name,
                u_home.name as Home,
                u_away.name as Away,
                tf.home_score || '-' || tf.away_score as Score,
                tf.status,
                tf.round_id -- Show if it's linked
            FROM tournament_fixtures tf
            JOIN tournament_phases tp ON tf.phase_id = tp.id
            LEFT JOIN users u_home ON tf.home_user_id = u_home.id
            LEFT JOIN users u_away ON tf.away_user_id = u_away.id
            WHERE tf.tournament_id = $1
            ORDER BY tp.order_index, tf.round_name, tf.id
            LIMIT 50 -- Cap output
        `,
        [t.id]
      );

      if (fixtures.rows.length > 0) {
        console.log(`\n📅 FIXTURES (First 50)`);
        console.table(
          fixtures.rows.map((f) => ({
            Phase: f.phase_name,
            Round: f.round_name,
            Match: `${f.home || 'TBD'} vs ${f.away || 'TBD'}`,
            Score: f.score,
            Status: f.status,
            GlobalRoundID: f.round_id || '❌ UNLINKED',
          }))
        );
      } else {
        console.log(`(No fixtures found)`);
      }
    }
  } catch (e) {
    console.error('Debug Error:', e);
  } finally {
    process.exit();
  }
}

debugView();
