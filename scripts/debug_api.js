import 'dotenv/config';

import { biwengerFetch } from '../src/lib/api/biwenger-client.js';
import { CONFIG } from '../src/lib/config.js';

async function test() {
  const leagueId = process.env.BIWENGER_LEAGUE_ID;
  console.log('Testing Board API for League:', leagueId);

  try {
    console.log('\n--- Test 1: Standard Call (0-50) ---');
    const res1 = await biwengerFetch(`/league/${leagueId}/board?offset=0&limit=50`);
    console.log('✅ Success! Items:', res1.data?.length);
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }

  try {
    console.log('\n--- Test 2: Lower Limit (0-10) ---');
    const res2 = await biwengerFetch(`/league/${leagueId}/board?offset=0&limit=10`);
    console.log('✅ Success! Items:', res2.data?.length);
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }

  try {
    console.log('\n--- Test 3: Explicit Type (transfer) ---');
    const res3 = await biwengerFetch(`/league/${leagueId}/board?offset=0&limit=20&type=transfer`);
    console.log('✅ Success! Items:', res3.data?.length);
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }

  try {
    console.log('\n--- Test 4: Without query params (Defaults?) ---');
    const res4 = await biwengerFetch(`/league/${leagueId}/board`);
    console.log('✅ Success! Items:', res4.data?.length);
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }

  try {
    console.log('\n--- Test 5: Standard Call WITHOUT Version Param (skipVersionCheck: true) ---');
    const res5 = await biwengerFetch(`/league/${leagueId}/board?offset=0&limit=50`, {
      skipVersionCheck: true,
    });
    console.log('✅ Success! Items:', res5.data?.length);
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }
}

test();
