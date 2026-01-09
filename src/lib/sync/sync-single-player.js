import './load-env.js';
import { db } from '../db/client.js';
import { fetchPlayerDetails } from '../api/biwenger-client.js';
import { fetchTeams, normalizePlayerName } from '../api/euroleague-client.js';
import { preparePlayerMutations } from '../db/mutations/players.js';
import { prepareEuroleagueMutations } from '../db/mutations/euroleague.js';
import { CONFIG } from '../config.js';

const args = process.argv.slice(2);
const TARGET_ID = args[0] ? parseInt(args[0]) : 31900;

if (!TARGET_ID) {
  console.error('Usage: node src/lib/sync/sync-single-player.js <PLAYER_ID>');
  process.exit(1);
}

// Helper: 19970121 -> "1997-01-21"
const parseBiwengerDate = (dateInt) => {
  if (!dateInt) return null;
  const str = dateInt.toString();
  if (str.length !== 8) return null;
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  return `${year}-${month}-${day}`;
};

// Helper: Slugify for Euroleague URL (o'shae -> o-shae)
const slugifyEuroleague = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/'/g, '-') // apostrophe to dash
    .replace(/\./g, '') // remove dots
    .replace(/[^a-z0-9\-]/g, '-') // special chars to dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-|-$/g, ''); // trim dashes
};

async function run() {
  // 0. Get Player Name from DB
  const player = db.prepare('SELECT name, team_id FROM players WHERE id = ?').get(TARGET_ID);
  if (!player) {
    console.error(`   ❌ Player ${TARGET_ID} not found in local DB. Cannot sync without name.`);
    return;
  }
  var biwengerName = player.name;
  console.log(`   👤 Syncing for: "${biwengerName}" (ID: ${TARGET_ID})`);

  // 1. Fetch Biwenger Details (Bio + Update)
  try {
    console.log('   📥 Fetching Biwenger Details...');
    const details = await fetchPlayerDetails(TARGET_ID);

    if (details.data) {
      const d = details.data;
      console.log(`   ✅ Fetched Biwenger Extras (Birth: ${d.birthday}, Height: ${d.height})`);

      const mutations = preparePlayerMutations(db);

      mutations.updatePlayerDetails({
        id: TARGET_ID,
        birth_date: parseBiwengerDate(d.birthday),
        height: d.height || null,
        weight: d.weight || null,
      });

      if (d.img) {
        db.prepare('UPDATE players SET img = ? WHERE id = ?').run(d.img, TARGET_ID);
      }

      console.log('   ✅ Updated Biwenger Info');
    } else {
      console.error('   ❌ No data found for player in Biwenger');
    }
  } catch (e) {
    console.error('   ❌ Error fetching Biwenger details:', e.message);
  }

  // 2. Sync Euroleague Data (Link Code)
  let elCodeToUse = null;
  try {
    console.log('\n   🌍 Fetching Euroleague Rosters...');
    const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
    const data = await fetchTeams(seasonCode);

    if (!data || !data.clubs || !data.clubs.club) {
      console.error('   ❌ No clubs found in Euroleague response');
      return;
    }

    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
    let matched = false;

    // Normalizing Biwenger Name
    const targetNormalized = normalizePlayerName(biwengerName);
    console.log(`   🔎 Looking for match for: "${biwengerName}" (${targetNormalized})`);

    const elMutations = prepareEuroleagueMutations(db);

    // Manual override map/check for complex names could go here
    const hardcodedMatches = {
      'oshae brissett': '014127',
      "o'shae brissett": '014127',
      'sahsa vezenkov': { code: '003469', slug: 'sasha-vezenkov' }, // Override Slug too!
    };

    let hardcodedSlug = null;

    // Check hardcoded first
    const matchKey = biwengerName.toLowerCase();
    if (hardcodedMatches[matchKey]) {
      const val = hardcodedMatches[matchKey];
      const code = typeof val === 'object' ? val.code : val;
      if (typeof val === 'object' && val.slug) hardcodedSlug = val.slug;

      elCodeToUse = `P${code}`;
      console.log(
        `   ⚡️ Using hardcoded override: ${elCodeToUse} (Slug: ${hardcodedSlug || 'Auto'})`
      );
      matched = true;
    }

    if (!matched) {
      for (const club of clubs) {
        if (!club.roster || !club.roster.player) continue;
        const players = Array.isArray(club.roster.player)
          ? club.roster.player
          : [club.roster.player];

        for (const p of players) {
          const elName = p.name;
          const elCode = `P${p.code}`;
          const normalizedElName = normalizePlayerName(elName);

          // Smart Matching
          let isMatch = normalizedElName === targetNormalized;

          // Partial/Fuzzy check (e.g. Brissett, Oshae J. vs Brissett, Oshae)
          if (!isMatch) {
            // Stripping all non-alpha
            const s1 = normalizedElName.replace(/[^a-z]/g, '');
            const s2 = targetNormalized.replace(/[^a-z]/g, '');
            if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) {
              // High confidence fuzzy?
              isMatch = true;
            }
          }

          if (isMatch) {
            console.log(`   ✅ FOUND MATCH: [${club.name}] ${elName} (${elCode})`);

            elMutations.updatePlayerLink.run({
              biwenger_id: TARGET_ID,
              el_code: elCode,
              dorsal: p.dorsal || null,
              country: p.countryname || null,
            });

            elMutations.insertPlayerMapping.run({
              biwenger_id: TARGET_ID,
              el_code: elCode,
              json: JSON.stringify(p),
            });

            console.log('   ✅ Updated Euroleague Link');
            matched = true;
            elCodeToUse = elCode;
            break;
          }
        }
        if (matched) break;
      }
    }

    if (!matched) {
      console.warn('   ⚠️ No Euroleague match found.');
    } else if (elCodeToUse) {
      // 3. Update Official Image (Scraping)
      console.log('\n   🖼️  Fetching Official Euroleague Image...');

      // Improved slug generation
      const slug = hardcodedSlug || slugifyEuroleague(biwengerName);
      console.log(`      Generated slug: ${slug}`);

      const cleanCode = elCodeToUse.toString().replace(/\D/g, '');
      const paddedId = cleanCode.padStart(6, '0');
      // Try multiple URL patterns if first fails? For now just standard.
      const url = `https://www.euroleaguebasketball.net/euroleague/players/${slug}/${paddedId}/`;

      console.log(`      Fetching URL: ${url}`);

      try {
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const regex = /"photo":"(https:\/\/media-cdn\.cortextech\.io\/[^"]+)"/;
          const match = html.match(regex);

          if (match && match[1]) {
            const imgUrl = match[1];
            console.log(`      ✅ Found Image: ${imgUrl}`);
            db.prepare('UPDATE players SET img = ? WHERE id = ?').run(imgUrl, TARGET_ID);
          } else {
            console.warn('      ⚠️ No image code found in page content.');
          }
        } else {
          console.warn(`      ⚠️ Failed to fetch page: ${res.status}`);
        }
      } catch (err) {
        console.error('      ❌ Error scraping image:', err.message);
      }
    }

    // 4. Sync Match Stats & FANTASY POINTS
    if (elCodeToUse && player.team_id) {
      console.log('\n   📊 Syncing Match Stats & Fantasy Points...');
      try {
        const { fetchBoxScore, parseBoxScoreStats, fetchSchedule } =
          await import('../api/euroleague-client.js');
        const { fetchRoundGames } = await import('../api/biwenger-client.js'); // Import for fantasy points

        const statsMutations = prepareEuroleagueMutations(db);

        // A) Fetch Euroleague Schedule
        console.log('      📅 Fetching Euroleague Schedule...');
        const schedule = await fetchSchedule(CONFIG.EUROLEAGUE.SEASON_CODE);
        const gameCodeMap = new Map();

        if (schedule?.schedule?.item) {
          const items = Array.isArray(schedule.schedule.item)
            ? schedule.schedule.item
            : [schedule.schedule.item];
          for (const item of items) {
            if (item.homecode && item.awaycode && item.game) {
              gameCodeMap.set(`${item.homecode.trim()}_${item.awaycode.trim()}`, item.game);
            }
          }
        }

        const teams = db.prepare('SELECT id, code FROM teams WHERE code IS NOT NULL').all();
        const teamIdToCode = new Map(teams.map((t) => [t.id, t.code]));

        // B) Get matches
        const matches = db
          .prepare(
            `
               SELECT m.round_id, m.home_id, m.away_id, m.date, m.id as match_id
               FROM matches m
               WHERE (m.home_id = ? OR m.away_id = ?)
                 AND m.date < datetime('now')
               ORDER BY m.date ASC
           `
          )
          .all(player.team_id, player.team_id);

        console.log(`      Found ${matches.length} past matches.`);

        for (const match of matches) {
          // 4.1 Euroleague Stats
          const homeCode = teamIdToCode.get(match.home_id);
          const awayCode = teamIdToCode.get(match.away_id);

          if (homeCode && awayCode) {
            const gameKey = `${homeCode}_${awayCode}`;
            const gameCode = gameCodeMap.get(gameKey);

            if (gameCode) {
              console.log(`      Processing Round ${match.round_id} (Game ${gameCode})...`);

              // Fetch Euroleague Stats
              try {
                const boxscore = await fetchBoxScore(gameCode, CONFIG.EUROLEAGUE.SEASON_CODE);
                if (boxscore) {
                  const stats = parseBoxScoreStats(boxscore);
                  const targetInt = parseInt(elCodeToUse.toString().replace(/\D/g, ''), 10);

                  const playerStats = stats.find((s) => {
                    if (!s.euroleague_code) return false;
                    const sInt = parseInt(s.euroleague_code.toString().replace(/\D/g, ''), 10);
                    return sInt === targetInt;
                  });

                  if (playerStats) {
                    // Insert initial stats with 0 fantasy points
                    statsMutations.insertPlayerStats.run({
                      player_id: TARGET_ID,
                      round_id: match.round_id,
                      fantasy_points: 0,
                      minutes: playerStats.minutes,
                      points: playerStats.points,
                      two_points_made: playerStats.two_points_made,
                      two_points_attempted: playerStats.two_points_attempted,
                      three_points_made: playerStats.three_points_made,
                      three_points_attempted: playerStats.three_points_attempted,
                      free_throws_made: playerStats.free_throws_made,
                      free_throws_attempted: playerStats.free_throws_attempted,
                      rebounds: playerStats.rebounds,
                      assists: playerStats.assists,
                      steals: playerStats.steals,
                      blocks: playerStats.blocks,
                      turnovers: playerStats.turnovers,
                      fouls_committed: playerStats.fouls_committed,
                      valuation: playerStats.valuation,
                    });
                    console.log(`         ✅ Euroleague Stats synced (${playerStats.points} pts)`);
                  }
                }
              } catch (err) {
                console.error(`         ❌ Euroleague sync failed: ${err.message}`);
              }
            }
          }

          // 4.2 Biwenger Fantasy Points
          // We fetch the games for this round from Biwenger to find the score
          try {
            console.log(`         Fetching Biwenger scores for Round ${match.round_id}...`);
            const roundGames = await fetchRoundGames(match.round_id);
            if (roundGames?.data?.games) {
              let foundScore = null;
              let gamesChecked = 0;
              let totalReports = 0;

              for (const game of roundGames.data.games) {
                gamesChecked++;

                // Safe extraction of reports (Biwenger returns arrays or object with numeric keys)
                const homeReports = Object.values(game.home?.reports || {});
                const awayReports = Object.values(game.away?.reports || {});

                const allReports = [...homeReports, ...awayReports];

                // Find our player
                const playerReport = allReports.find(
                  (r) => r.player && String(r.player.id) === String(TARGET_ID)
                );

                if (playerReport) {
                  foundScore = playerReport.points;
                  // console.log(`         ✅ Found player ${TARGET_ID} in Game ${game.id} (Score: ${foundScore})`);
                  break;
                }
              }

              if (foundScore !== null) {
                console.log(`         ⭐️ Biwenger Fantasy Points: ${foundScore}`);
                statsMutations.updateFantasyPoints.run({
                  fantasy_points: foundScore,
                  player_id: TARGET_ID,
                  round_id: match.round_id,
                });
              } else {
                console.log(
                  `         ⚠️ No fantasy points found in ${gamesChecked} games (${totalReports} total reports)`
                );
                // Optional: Log if we are missing it or if he didn't play according to Biwenger

                // Double check if strict integer comparison was the issue (keys are strings)
                // The above code uses includes(String(TARGET_ID)) so it should be safe.
              }
            }
          } catch (err) {
            console.error(`         ❌ Biwenger points sync failed: ${err.message}`);
          }

          // Rate limit protection
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (e) {
        console.error('   ❌ Error matching stats:', e);
      }
    }
  } catch (e) {
    console.error('   ❌ Error matching Euroleague data:', e);
  }
}

run();
