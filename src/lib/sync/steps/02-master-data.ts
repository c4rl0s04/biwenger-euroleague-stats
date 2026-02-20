import { fetchTeams } from '../../api/euroleague-client';
import { CONFIG } from '../../config';
import { prepareEuroleagueMutations } from '../../db/mutations/euroleague';
import { PlayerMatcher } from '../services/euroleague/matcher';
import { SyncManager } from '../manager';

/**
 * Step 2: Sync Euroleague Master Data
 * - Fetches Official Rosters
 * - Links Biwenger Players to Euroleague Codes (using Matcher Service)
 * @param manager
 */
export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n🌍 Step 2: Syncing Euroleague Master Data...');

  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  const mutations = prepareEuroleagueMutations(db as any);

  // 1. Fetch Euroleague Teams
  const data = await fetchTeams(seasonCode);
  if (!data || !data.clubs || !data.clubs.club) {
    throw new Error('No clubs found in Euroleague response');
  }
  const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
  manager.log(`   Found ${clubs.length} Euroleague clubs.`);

  // 2. Persist Team Count (for round calculation)
  await mutations.upsertSyncMeta({
    key: 'euroleague_team_count',
    value: String(clubs.length),
    updated_at: new Date().toISOString(),
  });

  // 3. Prepare for Matching
  const teamMap = new Map(); // EL Code -> Biwenger ID
  const biwengerTeams = await mutations.getDbTeams();

  // Helper: Tokenize and clean team names for comparison
  const sanitize = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[.,-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['basket', 'basketball', 'bc', 'club'].includes(w));
  };

  // Helper: Calculate Jaccard Similarity (Intersection over Union)
  const getSimilarity = (name1: string, name2: string) => {
    const s1 = new Set(sanitize(name1));
    const s2 = new Set(sanitize(name2));

    let intersection = 0;
    for (const w of Array.from(s1)) if (s2.has(w)) intersection++;

    const union = new Set([...Array.from(s1), ...Array.from(s2)]).size;
    return union === 0 ? 0 : intersection / union;
  };

  manager.log('   🧠 using Fuzzy Matching for Team Names...');

  for (const club of clubs) {
    // 1. Try Direct substring match (High confidence)
    let dbTeam = biwengerTeams.find((t: any) => t.name.toLowerCase() === club.name.toLowerCase());

    // 2. Fuzzy Token Match
    if (!dbTeam) {
      let bestMatch = null;
      let maxScore = 0;

      for (const t of biwengerTeams) {
        const score = getSimilarity(club.name, t.name);
        // Boost score if one name fully contains the other's token set (Subset match)
        // e.g. "Virtus Bologna" in "Virtus Segafredo Bologna"

        if (score > maxScore) {
          maxScore = score;
          bestMatch = t;
        }
      }

      // Threshold: 0.4 allows "Maccabi Playtika Tel Aviv" (4 tokens) vs "Maccabi Rapyd Tel Aviv" (4 tokens)
      if (maxScore >= 0.4 && bestMatch) {
        dbTeam = bestMatch;
        manager.log(
          `      ✅ Fuzzy Match: "${club.name}" ~ "${dbTeam.name}" (Score: ${maxScore.toFixed(2)})`
        );
      }
    }

    if (dbTeam) {
      teamMap.set(club.code, dbTeam.id);
      // Update team code in DB if needed
      await mutations.updateTeamCode(club.code, club.name, dbTeam.id);
    } else {
      manager.log(`   ⚠️ Could not link Euroleague club: ${club.name} (${club.code})`);
    }
  }

  // 4. Link Players
  const biwengerPlayers = await mutations.getAllPlayers();
  const matcher = new PlayerMatcher(manager);
  let linkedCount = 0;

  manager.log('   🔗 Linking Players...');

  for (const club of clubs) {
    const teamId = teamMap.get(club.code);
    if (!club.roster || !club.roster.player) continue;

    const roster = Array.isArray(club.roster.player) ? club.roster.player : [club.roster.player];

    for (const player of roster) {
      // Use the Matcher Service
      const match = await matcher.findMatch(player, biwengerPlayers, teamId);

      if (match) {
        // Persist the Link
        const elCode = `P${player.code}`;
        await mutations.updatePlayerLink({
          biwenger_id: match.id,
          el_code: elCode,
          dorsal: player.dorsal || null,
          country: player.countryname || null,
        });

        // Store full JSON for posterity
        await mutations.insertPlayerMapping({
          biwenger_id: match.id,
          el_code: elCode,
          json: JSON.stringify(player),
        });

        linkedCount++;
      }
    }
  }

  return {
    success: true,
    message: `Linked ${linkedCount} active Euroleague players.`,
  };
}
