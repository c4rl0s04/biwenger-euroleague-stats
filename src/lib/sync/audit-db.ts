import { db } from '../db/client';

async function audit() {
  console.log('🧐 Starting Database Integrity Audit...\n');

  // 1. Missing Team Info in Players
  const missingTeam = await db.query('SELECT COUNT(*) FROM players WHERE team_id IS NULL');
  console.log(`❌ Players without Team: ${missingTeam.rows[0].count}`);

  // 2. Missing Owner Info (potential orphans)
  const missingOwner = await db.query('SELECT COUNT(*) FROM players WHERE owner_id IS NULL');
  console.log(`❓ Players without Owner: ${missingOwner.rows[0].count}`);

  // 3. Players with 0 Points but have match stats
  const suspiciousPoints = await db.query(`
    SELECT COUNT(DISTINCT p.id) 
    FROM players p
    JOIN player_round_stats prs ON p.id = prs.player_id
    WHERE p.puntos = 0 AND prs.fantasy_points != 0
  `);
  console.log(
    `⚠️  Players with 0 points in master but stats exist: ${suspiciousPoints.rows[0].count}`
  );

  // 4. Missing Status/Images
  const missingStatus = await db.query('SELECT COUNT(*) FROM players WHERE status IS NULL');
  const missingImg = await db.query('SELECT COUNT(*) FROM players WHERE img IS NULL');
  console.log(`🖼️  Players without Image: ${missingImg.rows[0].count}`);
  console.log(`🏥 Players without Status: ${missingStatus.rows[0].count}`);

  // 5. Team Audit
  const missingTeamImg = await db.query('SELECT COUNT(*) FROM teams WHERE img IS NULL');
  console.log(`🏰 Teams without Logo: ${missingTeamImg.rows[0].count}`);

  // 6. Deep Dive: Find a sample of players with missing Team
  if (parseInt(missingTeam.rows[0].count) > 0) {
    console.log('\n📝 Sample players missing Team IDs:');
    const samples = await db.query('SELECT id, name FROM players WHERE team_id IS NULL LIMIT 10');
    samples.rows.forEach((p) => console.log(`   - [${p.id}] ${p.name}`));
  }

  // 7. Check if Team Names are missing
  const nullTeamNames = await db.query(
    "SELECT COUNT(*) FROM teams WHERE name IS NULL OR name = ''"
  );
  console.log(`\n📛 Teams with empty names: ${nullTeamNames.rows[0].count}`);

  console.log('\n🏁 Audit complete.');
  await db.end();
}

audit().catch(console.error);
