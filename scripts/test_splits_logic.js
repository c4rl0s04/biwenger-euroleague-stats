import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../data/local.db'));

const PLAYER_ID = 35188;

function debugSplits() {
    console.log(`🔍 Inspecting Player ${PLAYER_ID}...`);

    // 1. Get Player Team
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(PLAYER_ID);
    if (!player) {
        console.error('❌ Player not found!');
        return;
    }

    console.log(`\n👤 Player: ${player.name}`);
    console.log(`   Team (DB): "${player.team}"`);
    console.log(`   Hex:       ${Buffer.from(player.team).toString('hex')}`);

    // 2. Get Matches
    // This query mimics the one in src/lib/db/queries/players.js
    const matchesQuery = `
        SELECT 
            prs.round_id,
            m.round_name,
            m.home_team,
            m.away_team
        FROM player_round_stats prs
        JOIN players p ON prs.player_id = p.id
        LEFT JOIN matches m ON prs.round_id = m.round_id AND (m.home_team = p.team OR m.away_team = p.team)
        WHERE prs.player_id = ?
        ORDER BY prs.round_id ASC
    `;

    const matches = db.prepare(matchesQuery).all(PLAYER_ID);

    console.log(`\n📅 Found ${matches.length} matches. Checking Home/Away logic:\n`);

    let homeCount = 0;
    
    matches.forEach(m => {
        const isHomeExact = m.home_team === player.team;
        const pTeamNorm = player.team.trim().toLowerCase();
        const hTeamNorm = m.home_team ? m.home_team.trim().toLowerCase() : 'NULL';
        const isHomeNorm = pTeamNorm === hTeamNorm;

        if (isHomeExact) homeCount++;

         console.log(`   Match: ${m.round_name} | Home: "${m.home_team}" vs Player: "${player.team}"`);
         console.log(`     -> Exact Match: ${isHomeExact ? '✅ YES' : '❌ NO'}`);
         console.log('---');
    });
    
    console.log(`\nTotal Exact Home Matches found: ${homeCount}`);
}

debugSplits();
