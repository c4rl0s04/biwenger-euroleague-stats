import { fetchTeams, normalizePlayerName } from '../api/euroleague-client.js';
import { getShortTeamName } from '../utils/format.js';
import { CONFIG } from '../config.js';
import { prepareEuroleagueMutations } from '../db/mutations/euroleague.js';

/**
 * Syncs Euroleague Master Data (Teams & Players Linker)
 * This connects Biwenger IDs with Euroleague Codes
 * @param {import('./manager').SyncManager} manager
 */
export async function run(manager) {
  const db = manager.context.db;
  manager.log('\n🌍 Syncing Euroleague Teams & Rosters (Master Data)...');

  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  manager.log(`   Season: ${seasonCode}`);

  try {
    const data = await fetchTeams(seasonCode);

    if (!data || !data.clubs || !data.clubs.club) {
      manager.error('   ❌ No clubs found in Euroleague response');
      return { success: false, message: 'No clubs found' };
    }

    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
    manager.log(`   Found ${clubs.length} Euroleague clubs.`);

    // Initialize Mutations
    const mutations = prepareEuroleagueMutations(db);

    // Store team count in sync_meta for dynamic games/round calculation
    mutations.upsertSyncMeta.run({
      key: 'euroleague_team_count',
      value: String(clubs.length),
      updated_at: new Date().toISOString(),
    });

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
    const dbTeams = mutations.getDbTeams.all();
    manager.log('   ℹ️ Current DB Teams: ' + dbTeams.map((t) => t.name).join(', '));

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
        manager.log(
          `   ✅ Matched [${code}] "${elName}" -> DB: "${bestMatch.name}" (${bestScore} words)`
        );
        // Use the DB Name (Biwenger) to generate the short name, not the Euroleague Name
        const correctShortName = getShortTeamName(bestMatch.name);

        // Update by specific ID to avoid matching multiple teams
        // (updateTeamMaster uses fuzzy WHERE that can match multiple teams incorrectly)
        mutations.updateTeamCode.run(code, correctShortName, bestMatch.id);
        teamMap.set(code, bestMatch.id);
      } else {
        manager.log(`   ⚠️ No match for [${code}] "${elName}"`);
      }
    }

    // 2. Sync Players (Linker)
    manager.log('   🔗 Linking Players (Biwenger ↔ Euroleague)...');

    // Get all Biwenger players to search against
    const biwengerPlayers = mutations.getBiwengerPlayers.all();

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

          mutations.updatePlayerLink.run({
            biwenger_id: match.id,
            el_code: elCode,
            dorsal: player.dorsal || null, // V3 dorsal is nullable for now
            country: player.countryname || null,
          });

          mutations.insertPlayerMapping.run({
            biwenger_id: match.id,
            el_code: elCode,
            json: JSON.stringify(player),
          });

          linkedCount++;
        }
      }
    }

    // manager.log(`   ✅ Linked ${linkedCount}/${totalElPlayers} active Euroleague players.`);
    return {
      success: true,
      message: `Linked ${linkedCount}/${totalElPlayers} active Euroleague players.`,
    };
  } catch (e) {
    manager.error('   ❌ Error syncing master data:', e);
    return { success: false, message: e.message, error: e };
  }
}

// Legacy export for compatibility
export const syncEuroleagueMaster = async (db) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  return run(mockManager);
};
