import 'dotenv/config';
import { db } from '../src/lib/db/client.js';
import { getUserPerformanceHistoryService } from '../src/lib/services/roundsService.js';

async function verify() {
  try {
    const userRes = await db.query('SELECT id, name FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found');
      return;
    }
    const user = userRes.rows[0];
    console.log(`Checking history for user: ${user.name} (${user.id})`);

    const start = Date.now();
    const history = await getUserPerformanceHistoryService(user.id);
    const ms = Date.now() - start;

    console.log(`Fetch took ${ms}ms`);
    console.log(`Found ${history.length} round entries for user ${user.name}`);

    if (history.length > 0) {
      console.log('First entry:', history[0]);
      console.log('Last entry:', history[history.length - 1]);
    } else {
      console.log('Returned empty history');
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    process.exit(0);
  }
}

verify();
