# Biwenger Stats - Data Synchronization

The application relies on a robust synchronization system to fetch data from Biwenger and Euroleague APIs.

## 🚀 How to Sync

Run the main sync command to update everything:

```bash
npm run sync
```

This executes `src/lib/sync/index.js`, which orchestrates the entire process.

### Sync Modes

You can run specific parts of the sync process if needed (though `npm run sync` is usually sufficient):

- **`node src/lib/sync/index.js --no-details`**:  
  Skips fetching full player details (bio, history) to speed up the process. Useful for quick score updates.

---

## 🔄 Sync Pipeline

The sync is an idempotent pipeline orchestrated by `src/lib/sync/index.js`. It runs a series of sequential "Steps" found in `src/lib/sync/steps/`:

1.  **`01-players.js`**: Fetches master player list from Biwenger. Updates prices and positions.
2.  **`02-master-data.js`**: Syncs Euroleague teams and round info.
3.  **`03-matches.js`**: Updates the full season schedule and live scores.
4.  **`05-stats.js`**: Downloads official boxscores (Points, Rebounds, etc.) for finished games and processes fantasy points.
5.  **`06-lineups.js`**: Records the actual lineups used by managers in past rounds.
6.  **`07-market.js`**: Processes the "Board" (news feed) to track transfers and bids.
7.  **`13-porras.js`**: Syncs user predictions from the league minigame.

### "Live" Mode

A lighter version (`npm run sync:live`) skips heavy biographical data fetching and focuses only on:

- Live match scores
- Current round fantasy points
- Lineup updates

---

## 🛠 Troubleshooting

If data appears missing or incorrect:

1.  **Check Token**: Ensure `BIWENGER_TOKEN` in `.env.local` is valid.
2.  **Force Sync**: Run `npm run sync` again.
3.  **Check Logs**: The sync script outputs detailed logs. Look for "Error" messages.

> **Note**: The sync process is idempotent. You can run it multiple times without duplicating data; it will update existing records.
