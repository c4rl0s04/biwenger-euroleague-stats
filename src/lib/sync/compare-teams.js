/**
 * Quick script to compare team names between Biwenger and EuroLeague APIs
 * Uses fuzzy word-overlap matching (same as sync-euroleague-master.js)
 * Run with: node src/lib/sync/compare-teams.js
 */

import { XMLParser } from 'fast-xml-parser';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

// Fuzzy matching helpers (same as sync-euroleague-master.js)
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

async function main() {
  console.log('🔍 Fetching teams from both APIs...\n');

  // 1. Fetch Biwenger Teams
  const biwengerRes = await fetch('https://biwenger.as.com/api/v2/competitions/euroleague/data', {
    headers: {
      Authorization: `Bearer ${process.env.BIWENGER_TOKEN}`,
      'X-League': process.env.BIWENGER_LEAGUE_ID,
      'X-User': process.env.BIWENGER_USER_ID,
    },
  });
  const biwengerData = await biwengerRes.json();
  const biwengerTeams = biwengerData.data?.teams || {};

  console.log('--- BIWENGER TEAMS ---');
  const biwengerList = [];
  for (const [id, team] of Object.entries(biwengerTeams)) {
    const tokens = tokenize(team.name);
    console.log(`  [${id}] ${team.name} -> tokens: [${tokens.join(', ')}]`);
    biwengerList.push({ id, name: team.name, tokens });
  }

  // 2. Fetch EuroLeague Teams
  const elRes = await fetch(
    'https://api-live.euroleague.net/v1/teams?seasonCode=E2025&competitionCode=E'
  );
  const elXml = await elRes.text();
  const elData = parser.parse(elXml);
  const clubs = elData.clubs?.club || [];

  console.log('\n--- EUROLEAGUE TEAMS ---');
  const elList = [];
  for (const club of clubs) {
    const tokens = tokenize(club.clubname);
    console.log(`  [${club.code}] ${club.clubname} -> tokens: [${tokens.join(', ')}]`);
    elList.push({ code: club.code, name: club.clubname, tokens });
  }

  // 3. Compare using fuzzy matching
  console.log('\n--- MATCHING ANALYSIS (fuzzy word overlap) ---');
  let matched = 0;
  let unmatched = [];

  for (const el of elList) {
    let bestMatch = null;
    let bestScore = 0;

    for (const bw of biwengerList) {
      const matchCount = countMatchingWords(el.tokens, bw.tokens);
      const minRequired = Math.min(2, Math.ceil(Math.min(el.tokens.length, bw.tokens.length) / 2));

      if (matchCount >= minRequired && matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = bw;
      }
    }

    if (bestMatch) {
      console.log(
        `  ✅ [${el.code}] "${el.name}" <-> [${bestMatch.id}] "${bestMatch.name}" (${bestScore} words)`
      );
      matched++;
    } else {
      console.log(`  ❌ [${el.code}] "${el.name}" -> NO MATCH`);
      unmatched.push(el);
    }
  }

  console.log(`\n📊 Summary: ${matched}/${elList.length} matched.`);
  if (unmatched.length > 0) {
    console.log('   Unmatched EuroLeague teams:', unmatched.map((u) => u.name).join(', '));
  } else {
    console.log('   🎉 All teams matched! Ready to sync.');
  }
}

main().catch(console.error);
