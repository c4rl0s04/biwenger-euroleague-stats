import {
  fetchClubs,
  fetchGameStats,
  parseGameStats,
  normalizePlayerName,
} from '../api/euroleague-client.js';
import { getShortTeamName } from '../utils/format.js';
import { CONFIG } from '../config.js';

/**
 * Syncs Euroleague Master Data (Teams & Players Linker) using V3 API
 * This connects Biwenger IDs with Euroleague Codes
 * @param {import('better-sqlite3').Database} db
 */
export async function syncEuroleagueMaster(db) {
  console.log('\n🌍 Syncing Euroleague Teams & Rosters (V3 API)...');

  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  console.log(`   Season: ${seasonCode}`);

  try {
    // 1. Fetch clubs from V3
    const clubs = await fetchClubs();

    if (!clubs || clubs.length === 0) {
      console.error('   ❌ No clubs found in Euroleague V3 response');
      return;
    }

    console.log(`   Found ${clubs.length} Euroleague clubs.`);

    // Store team count in sync_meta for dynamic games/round calculation
    const upsertMeta = db.prepare(`
      INSERT INTO sync_meta (key, value, updated_at) VALUES (@key, @value, @updated_at)
      ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = @updated_at
    `);
    upsertMeta.run({
      key: 'euroleague_team_count',
      value: String(clubs.length),
      updated_at: new Date().toISOString(),
    });

    // Fuzzy matching helpers
    const tokenize = (name) => {
      const stopWords = ['FC', 'THE', 'BC', 'BK', 'AND', 'OF', 'DE', 'DEL'];
      return name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.includes(word));
    };

    const countMatchingWords = (tokens1, tokens2) => {
      return tokens1.filter((t) => tokens2.includes(t)).length;
    };

    // Get current DB teams
    const dbTeams = db.prepare('SELECT id, name FROM teams').all();
    const dbTeamsTokenized = dbTeams.map((t) => ({
      ...t,
      tokens: tokenize(t.name),
    }));

    // We only want EuroLeague clubs (not BCL etc.) - filter by having IST, MAD, etc. codes
    // V3 clubs returns ALL clubs across competitions. Filter to ones with 3-letter codes
    // that match typical EuroLeague team codes.
    const euroLeagueClubs = clubs.filter((c) => c.code && c.code.length === 3);
    console.log(`   Filtering to ${euroLeagueClubs.length} potential EuroLeague clubs.`);

    // Map: EL Code -> Biwenger Team ID
    const teamMap = new Map();

    // 2. Match EuroLeague clubs to DB teams
    for (const club of euroLeagueClubs) {
      const code = club.code;
      const elName = club.name;
      const elTokens = tokenize(elName);
      const shortName = getShortTeamName(club.name);

      // Find best match by word overlap
      let bestMatch = null;
      let bestScore = 0;

      for (const dbTeam of dbTeamsTokenized) {
        const matchCount = countMatchingWords(elTokens, dbTeam.tokens);
        const minRequired = Math.min(
          2,
          Math.ceil(Math.min(elTokens.length, dbTeam.tokens.length) / 2)
        );

        if (matchCount >= minRequired && matchCount > bestScore) {
          bestScore = matchCount;
          bestMatch = dbTeam;
        }
      }

      if (bestMatch) {
        console.log(
          `   ✅ Matched [${code}] "${elName}" -> DB: "${bestMatch.name}" (${bestScore} words)`
        );
        db.prepare('UPDATE teams SET code = ?, short_name = ? WHERE id = ?').run(
          code,
          shortName,
          bestMatch.id
        );
        teamMap.set(code, bestMatch.id);
      }
    }

    // 3. Link Players by fetching recent game stats
    // V3 doesn't have a dedicated roster endpoint, but game stats include full player info
    console.log('   🔗 Linking Players (from recent games)...');

    const biwengerPlayers = db.prepare('SELECT id, name, team_id FROM players').all();
    const updatePlayer = db.prepare(`
      UPDATE players
      SET euroleague_code = @el_code, height = @height, weight = @weight, birth_date = @birth_date
      WHERE id = @biwenger_id
    `);

    const insertMapping = db.prepare(`
      INSERT OR REPLACE INTO player_mappings (biwenger_id, euroleague_code, details_json)
      VALUES (@biwenger_id, @el_code, @json)
    `);

    // Fetch first 10 games to get player roster info
    const seenPlayers = new Set();
    let linkedCount = 0;
    let totalPlayers = 0;

    for (let gameCode = 1; gameCode <= 10; gameCode++) {
      const gameStats = await fetchGameStats(gameCode, seasonCode);
      if (!gameStats) continue;

      const playerStats = parseGameStats(gameStats);

      for (const stat of playerStats) {
        if (!stat.euroleague_code || seenPlayers.has(stat.euroleague_code)) continue;
        seenPlayers.add(stat.euroleague_code);
        totalPlayers++;

        // V3 codes don't need P prefix - they match directly
        const elCode = stat.euroleague_code;
        const normalizedName = normalizePlayerName(stat.name);

        // Find match in Biwenger DB
        let match = biwengerPlayers.find((p) => normalizePlayerName(p.name) === normalizedName);

        // Fallback: team + lastname match
        const elTeamId = teamMap.get(stat.team_code);
        if (!match && elTeamId) {
          const lastName = normalizedName.split(' ')[1] || normalizedName;
          match = biwengerPlayers.find(
            (p) =>
              p.team_id === elTeamId &&
              (normalizePlayerName(p.name).includes(lastName) ||
                lastName.includes(normalizePlayerName(p.name).split(' ')[1] || ''))
          );
        }

        if (match) {
          updatePlayer.run({
            biwenger_id: match.id,
            el_code: elCode,
            height: stat.height || null,
            weight: stat.weight || null,
            birth_date: stat.birth_date ? stat.birth_date.split('T')[0] : null,
          });

          insertMapping.run({
            biwenger_id: match.id,
            el_code: elCode,
            json: JSON.stringify(stat),
          });

          linkedCount++;
        }
      }
    }

    console.log(`   ✅ Linked ${linkedCount}/${totalPlayers} players from game data.`);
  } catch (e) {
    console.error('   ❌ Error syncing master data:', e);
  }
}
