
import { fetchNewsFeed } from '../src/lib/services/app/dashboardService.js';
import { fetchAllUsers } from '../src/lib/services/core/userService.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    console.log("Testing fetchAllUsers...");
    const users = await fetchAllUsers();
    console.log(`Successfully fetched ${users.length} users.`);

    console.log("Testing fetchNewsFeed...");
    const news = await fetchNewsFeed();
    console.log(`Successfully fetched ${news.length} news items.`);
    
    if (news.length > 0) {
        console.log("Sample news:", news[0]);
    } else {
        console.log("News feed is empty.");
    }
    
    process.exit(0);

  } catch (error) {
    console.error("Service execution failed:", error);
    process.exit(1);
  }
}

main();
