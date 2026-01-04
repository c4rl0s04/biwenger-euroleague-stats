import { fetchTeams, normalizePlayerName } from '../api/euroleague-client.js';
import { getShortTeamName } from '../utils/format.js';
import { CONFIG } from '../config.js';

/**
 * Syncs Euroleague Master Data (Teams & Players Linker)
 * This connects Biwenger IDs with Euroleague Codes
 * @param {import('better-sqlite3').Database} db
 */
export async function syncEuroleagueMaster(db) {
  console.log('\n🌍 Syncing Euroleague Teams & Rosters (Master Data)...');

  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  console.log(`   Season: ${seasonCode}`);

  try {
    const data = await fetchTeams(seasonCode);

    if (!data || !data.clubs || !data.clubs.club) {
      console.error('   ❌ No clubs found in Euroleague response');
      return;
    }

    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
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

    // Prepare Statements
    const updateTeam = db.prepare(`
      UPDATE teams 
      SET code = @code, name = @name, short_name = @short_name
      WHERE name LIKE @fuzzy_name OR short_name = @short_name
    `);

    // We also want to capture the Euroleague Team Code -> Biwenger Team ID map
    const teamMap = new Map(); // EL Code -> Biwenger ID

    // Fuzzy matching helper: tokenize name into significant words
    const tokenize = (name) => {
      const stopWords = ['FC', 'THE', 'BC', 'BK', 'AND', 'OF', 'DE', 'DEL'];
      return name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.includes(word));
    };

    // Count matching words between two token arrays
    const countMatchingWords = (tokens1, tokens2) => {
      return tokens1.filter((t) => tokens2.includes(t)).length;
    };

    // Get current DB teams
    const dbTeams = db.prepare('SELECT id, name FROM teams').all();
    console.log('   ℹ️ Current DB Teams:', dbTeams.map((t) => t.name).join(', '));

    // Pre-tokenize DB teams
    const dbTeamsTokenized = dbTeams.map((t) => ({
      ...t,
      tokens: tokenize(t.name),
    }));

    // 1. Sync Teams using fuzzy matching
    for (const club of clubs) {
      const code = club.code;
      const elName = club.name;
      const elTokens = tokenize(elName);
      const shortName = getShortTeamName(club.name);

      // Find best match by word overlap
      let bestMatch = null;
      let bestScore = 0;

      for (const dbTeam of dbTeamsTokenized) {
        const matchCount = countMatchingWords(elTokens, dbTeam.tokens);
        // Require at least 2 matching words OR >50% of the shorter name
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
      } else {
        console.log(`   ⚠️ No match for [${code}] "${elName}"`);
      }
    }

    // 2. Sync Players (Linker)
    console.log('   🔗 Linking Players (Biwenger ↔ Euroleague)...');

    const updatePlayer = db.prepare(`
        UPDATE players
        SET 
            euroleague_code = @el_code,
            height = @height,
            weight = @weight,
            birth_date = @birth_date,
            position = @position,
            dorsal = @dorsal,
            country = @country
        WHERE id = @biwenger_id
    `);

    const insertMapping = db.prepare(`
        INSERT OR REPLACE INTO player_mappings (biwenger_id, euroleague_code, details_json)
        VALUES (@biwenger_id, @el_code, @json)
    `);

    // Get all Biwenger players to search against
    const biwengerPlayers = db.prepare('SELECT id, name, team_id FROM players').all();

    let linkedCount = 0;
    let totalElPlayers = 0;

    for (const club of clubs) {
      // Use roster.player instead of members.member - roster only contains actual players
      if (!club.roster || !club.roster.player) continue;

      const players = Array.isArray(club.roster.player) ? club.roster.player : [club.roster.player];
      const elTeamId = teamMap.get(club.code);

      for (const player of players) {
        totalElPlayers++;

        const elName = player.name; // "BEAUBOIS, RODRIGUE"
        // Add "P" prefix to match BoxScore API Player_ID format
        // Roster API returns: code="009005"
        // BoxScore API returns: Player_ID="P009005"
        const elCode = `P${player.code}`;
        const normalizedElName = normalizePlayerName(elName);

        // Find match in Biwenger DB
        // 1. By exact normalized name
        // 2. By team filter + fuzzy name

        let match = biwengerPlayers.find((p) => normalizePlayerName(p.name) === normalizedElName);

        // Heuristic: If we know the team, filter by team first
        if (!match && elTeamId) {
          match = biwengerPlayers.find(
            (p) =>
              p.team_id === elTeamId &&
              (normalizePlayerName(p.name).includes(normalizedElName.split(' ')[1]) || // Lastname match
                normalizedElName.includes(normalizePlayerName(p.name).split(' ')[1]))
          );
        }

        if (match) {
          // Found a link!
          // Note: roster.player doesn't have height/weight - would need separate player API call
          // For now just link the CODE. Bio data can come from Biwenger or separate fetch.

          updatePlayer.run({
            biwenger_id: match.id,
            el_code: elCode,
            height: null,
            weight: null,
            birth_date: null,
            position: player.position, // "Guard", "Center", "Forward"
            dorsal: player.dorsal || null,
            country: player.countryname || null,
          });

          insertMapping.run({
            biwenger_id: match.id,
            el_code: elCode,
            json: JSON.stringify(player),
          });

          linkedCount++;
        }
      }
    }

    console.log(`   ✅ Linked ${linkedCount}/${totalElPlayers} active Euroleague players.`);
  } catch (e) {
    console.error('   ❌ Error syncing master data:', e);
  }
}
