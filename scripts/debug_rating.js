import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getCoachRating } from '../src/lib/db/queries/rounds.js';

const USER_ID = '13207868'; // All Stars
// const USER_ID = '16922030'; // Another user?
const ROUND_ID = '4769'; // Latest round

async function runDebug() {
  console.log(`Checking Coach Rating for User ${USER_ID} Round ${ROUND_ID}...`);

  try {
    const rating = await getCoachRating(USER_ID, ROUND_ID);
    console.log('Coach Rating Result:', JSON.stringify(rating, null, 2));

    // Check if Vezenkov (577) is in Ideal Lineup
    const hasVezenkov = rating.idealLineup.some((p) => p.player_id === 577);
    console.log('Has Vezenkov in Ideal:', hasVezenkov);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

runDebug();
