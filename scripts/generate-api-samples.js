import 'dotenv/config';
import fs from 'fs/promises';
import { CONFIG } from '../src/lib/config.js';

async function fetchBiwenger(endpoint) {
  const url = `${CONFIG.API.BASE_URL}${endpoint}`;
  console.log(`Fetching ${url}...`);
  const headers = {
    Authorization: `Bearer ${CONFIG.API.TOKEN}`,
    'X-League': CONFIG.API.LEAGUE_ID,
    'X-User': CONFIG.API.USER_ID,
    Accept: 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`Status ${res.status}: ${res.statusText}`);
      const text = await res.text();
      console.error('Body:', text.substring(0, 200));
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

const EUROLEAGUE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: '*/*',
};

async function fetchEuroleague(url) {
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, { headers: EUROLEAGUE_HEADERS });
    if (!res.ok) {
      console.error(`Status ${res.status}: ${res.statusText}`);
      return null;
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(
        `Failed to parse Euroleague JSON from ${url}. Response start: ${text.substring(0, 100)}`
      );
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function run() {
  const samples = {};

  // 1. Biwenger Master Data
  const compData = await fetchBiwenger(CONFIG.ENDPOINTS.BIWENGER.COMPETITION_DATA);
  if (compData && compData.data) {
    const samplePlayerId = Object.keys(compData.data.players || {})[0];
    const sampleTeamId = Object.keys(compData.data.teams || {})[0];

    samples.masterData = {
      data: {
        players: {
          [samplePlayerId]: compData.data.players[samplePlayerId],
        },
        teams: {
          [sampleTeamId]: compData.data.teams[sampleTeamId],
        },
        rounds: compData.data.rounds ? compData.data.rounds.slice(0, 1) : [],
      },
    };
  }

  // 2. League Board (Market)
  const boardData = await fetchBiwenger(
    CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(CONFIG.API.LEAGUE_ID, 0, 5)
  );
  if (boardData && boardData.data) {
    samples.leagueBoard = {
      data: boardData.data.slice(0, 2),
    };
  }

  // 3. Round Stats
  let finishedRoundId = null;
  if (compData && compData.data && compData.data.rounds) {
    const finished = compData.data.rounds.find((r) => r.status === 'finished');
    if (finished) finishedRoundId = finished.id;
  }

  if (finishedRoundId) {
    const roundStats = await fetchBiwenger(CONFIG.ENDPOINTS.BIWENGER.ROUND_LEAGUE(finishedRoundId));
    if (roundStats && roundStats.data) {
      const pIds = Object.keys(roundStats.data);
      const subset = {};
      pIds.slice(0, 2).forEach((pid) => (subset[pid] = roundStats.data[pid]));
      samples.roundStats = { data: subset };
    }
  }

  // 4. User Lineup
  const lineupUrl = `/user/${CONFIG.API.USER_ID}?fields=lineup`;
  const userLineup = await fetchBiwenger(lineupUrl);
  if (userLineup && userLineup.data) {
    samples.userLineup = userLineup;
  }

  // 5. Standings
  const standingsData = await fetchBiwenger(
    CONFIG.ENDPOINTS.BIWENGER.LEAGUE_STANDINGS(CONFIG.API.LEAGUE_ID)
  );
  if (standingsData && standingsData.data) {
    samples.standings = {
      data: {
        standings: standingsData.data.standings.slice(0, 2),
      },
    };
  }

  // 6. Euroleague Schedule & Boxscore
  const scheduleUrl = `${CONFIG.EUROLEAGUE.API_V1_URL}/v1/schedules?seasonCode=${CONFIG.EUROLEAGUE.SEASON_CODE}&competitionCode=E`;
  // Note: API_V1 returns XML usually? client says parser.parse(xml).
  // Wait, src/lib/api/euroleague-client.js uses XMLParser for V1!
  // But FetchBoxscore uses Legacy API which returns JSON.
  // I should try to fetch Boxscore directly if I can guess a gamecode, or use Legacy Schedule if it returns JSON.
  // The client uses V1 for Schedule (XML) and Legacy for Boxscore (JSON).
  // I don't want to parse XML in this simple script if I can avoid it.
  // Let's rely on Boxscore fetch with a hardcoded recent gamecode if possible, or try Legacy url for schedule if it exists.
  // Legacy Schedule: https://live.euroleague.net/api/Schedules?seasoncode=E2025 (JSON) - verified in previous docs.

  const legacyScheduleUrl = `${CONFIG.EUROLEAGUE.API_LEGACY_URL}/Schedules?seasoncode=${CONFIG.EUROLEAGUE.SEASON_CODE}`;
  const scheduleData = await fetchEuroleague(legacyScheduleUrl);

  if (scheduleData && scheduleData.gamedays) {
    samples.schedule = {
      gamedays: [
        {
          ...scheduleData.gamedays[0],
          games: scheduleData.gamedays[0].games.slice(0, 1),
        },
      ],
    };

    const firstGame = scheduleData.gamedays.find((g) => g.games && g.games.length > 0)?.games[0];
    if (firstGame) {
      const gameCode = firstGame.gamecode;
      const boxscoreUrl = `${CONFIG.EUROLEAGUE.API_LEGACY_URL}/Boxscore?gamecode=${gameCode}&seasoncode=${CONFIG.EUROLEAGUE.SEASON_CODE}`;
      const boxscoreData = await fetchEuroleague(boxscoreUrl);
      if (boxscoreData) {
        // Truncate for brevity
        if (boxscoreData.Stats) {
          boxscoreData.Stats = boxscoreData.Stats.map((team) => ({
            ...team,
            PlayersStats: team.PlayersStats.slice(0, 2),
          }));
        }
        samples.boxscore = boxscoreData;
      }
    }
  }

  await fs.writeFile('api_samples_output.json', JSON.stringify(samples, null, 2));
  console.log('Samples saved to api_samples_output.json');
}

run();
