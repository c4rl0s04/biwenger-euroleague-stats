import 'dotenv/config';
import { db } from '../../src/lib/db/client';

// 1. Updated Dictionary: Exact DB names mapped to their Code AND Competition (E = Euroleague, U = EuroCup)
const EUROLEAGUE_API_CODES = {
  'AS Monaco': { code: 'MCO', comp: 'E' },
  'Crvena Zvezda Meridianbet Belgrade': { code: 'CZV', comp: 'E' },
  'FC Barcelona': { code: 'BAR', comp: 'E' },
  'Fenerbahce Beko Istanbul': { code: 'FNB', comp: 'E' },
  'Hapoel IBI Tel Aviv': { code: 'HTV', comp: 'U' }, // EuroCup team
  'Olympiacos Piraeus': { code: 'OLY', comp: 'E' },
  'Panathinaikos Athens': { code: 'PAO', comp: 'E' },
  'Real Madrid': { code: 'MAD', comp: 'E' },
  'Valencia Basket': { code: 'VBC', comp: 'U' }, // EuroCup team
  'Zalgiris Kaunas': { code: 'ZAL', comp: 'E' },
};

async function repairTeamIds() {
  console.log('🔍 Checking NULL team_id count before repair...');
  const before = await db.query(`SELECT COUNT(*) FROM players WHERE team_id IS NULL`);
  console.log(`   Before: ${before.rows[0].count} players with NULL team_id\n`);

  const teamsResult = await db.query(
    `SELECT id, name FROM teams WHERE is_active = true ORDER BY name`
  );
  const dbTeams = teamsResult.rows;
  console.log(`📋 Processing ${dbTeams.length} active teams...\n`);

  let totalRestored = 0;

  for (const team of dbTeams) {
    const teamData = EUROLEAGUE_API_CODES[team.name];

    if (!teamData) {
      console.log(`   ⏭️  Skipping ${team.name} - No API code mapped in the dictionary.`);
      continue;
    }

    // Dynamically build the season code (E2025 or U2025)
    const seasonCode = `${teamData.comp}2025`;
    const url = `https://api-live.euroleague.net/v1/clubs?clubCode=${teamData.code}&seasonCode=${seasonCode}`;

    try {
      // Added standard headers to prevent 400/403 blocks from the API
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/xml, text/xml, */*',
        },
      });

      if (!res.ok) {
        console.log(`   ⚠️  ${team.name} (${teamData.code}): API returned ${res.status}`);
        // Optional: Log the exact error text to see WHY the API rejected it
        const errorText = await res.text();
        console.log(`       Error details: ${errorText.substring(0, 100)}`);
        continue;
      }

      const xml = await res.text();

      // Extract all player codes from the XML roster
      const playerCodes = [...xml.matchAll(/<code>(\d+)<\/code>/gi)].map((m) => m[1]);

      if (playerCodes.length === 0) {
        console.log(
          `   ⚠️  ${team.name} (${teamData.code}): No players found in roster (Endpoint might be returning JSON instead of XML)`
        );
        continue;
      }

      const codeVariants = playerCodes.flatMap((c) => [c, `P${c}`]);

      const result = await db.query(
        `UPDATE players 
                 SET team_id = $1 
                 WHERE team_id IS NULL 
                   AND euroleague_code = ANY($2::text[])`,
        [team.id, codeVariants]
      );

      const restored = result.rowCount ?? 0;
      totalRestored += restored;
      console.log(
        `   ✅ ${team.name} (${teamData.code}): ${playerCodes.length} in roster, restored ${restored} players`
      );
    } catch (e) {
      console.log(`   ❌ ${team.name} (${teamData.code}): ${e.message}`);
    }
  }

  console.log(`\n🎉 Done! Restored team_id for ${totalRestored} players total.`);

  const after = await db.query(`SELECT COUNT(*) FROM players WHERE team_id IS NULL`);
  console.log(`   After: ${after.rows[0].count} players still with NULL team_id`);

  process.exit(0);
}

repairTeamIds();
