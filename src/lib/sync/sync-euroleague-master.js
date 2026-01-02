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

    // Prepare Statements
    const updateTeam = db.prepare(`
      UPDATE teams 
      SET code = @code, name = @name, short_name = @short_name
      WHERE name LIKE @fuzzy_name OR short_name = @short_name
    `);

    // We also want to capture the Euroleague Team Code -> Biwenger Team ID map
    const teamMap = new Map(); // EL Code -> Biwenger ID

    // 1. Sync Teams
    for (const club of clubs) {
      const code = club.code;
      const name = club.name;
      const shortName = getShortTeamName(name);

      // Try to match with existing Biwenger teams
      // We use fuzzy matching on name
      updateTeam.run({
        code: code,
        name: name,
        short_name: shortName,
        fuzzy_name: `%${name.split(' ')[0]}%`, // Heuristic: "Real" matches "Real Madrid"
      });

      // Get the ID for our map
      const teamRow = db.prepare('SELECT id FROM teams WHERE code = ?').get(code);
      if (teamRow) {
        teamMap.set(code, teamRow.id);
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
            position = @position
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
      if (!club.members || !club.members.member) continue;

      const members = Array.isArray(club.members.member)
        ? club.members.member
        : [club.members.member];
      const elTeamId = teamMap.get(club.code);

      for (const member of members) {
        if (member.active !== 'true') continue; // Skip inactive? Maybe keep them.
        totalElPlayers++;

        const elName = member.name; // "CAMPAZZO, FACUNDO"
        const elCode = member.code;
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
          const height = member.height ? parseInt(member.height) : null;
          const weight = member.weight ? parseInt(member.weight) : null;

          // Format Birth Date: "1991-03-23" -> already in correct format mostly?
          // XML example: "CAMPAZZO, FACUNDO" ... no birthdate in that snippet.
          // Wait, snippet 1418 didn't show birthdate in <member> attributes?
          // Ah, looking closely at 1418: <member profile="J" active="true" code="011082" name="CAMPAZZO, FACUNDO" alias="CAMPAZZO, F." dorsal="7" position="Guard" countrycode="ARG" countryname="Argentina" signin="2023-09-15..." signout="2025-06-30..." />
          // It DOES NOT have bio data in this list!
          // That's a discovery. We might need `fetchPlayer` or extract it from elsewhere?
          // Wait, Biwenger has `birth_date`. EuroLeague boxscore usually has age.
          // Let's rely on Biwenger for bio if EL xml lacks it, OR fetch details.
          // Actually, the `fetchRoster` might get more details?
          // For now, let's link the CODE. Bio data is a "nice to have".

          updatePlayer.run({
            biwenger_id: match.id,
            el_code: elCode,
            height: height,
            weight: weight,
            birth_date: null, // Placeholder
            position: member.position, // "Guard"
          });

          insertMapping.run({
            biwenger_id: match.id,
            el_code: elCode,
            json: JSON.stringify(member),
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
