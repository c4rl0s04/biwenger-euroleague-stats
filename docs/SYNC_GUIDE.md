# Selective Sync Guide 🔄

This guide explains how to use the synchronization script with specific flags to control what data is updated. This is crucial for:

1.  **Avoiding API Rate Limits** (Biwenger 429 Errors).
2.  **Speeding up syncs** by skipping unnecessary historical data.
3.  **Targeting specific updates** (e.g., just the market or just live scores).

## Usage

Run the sync command with double dashes before the flags:

```bash
npm run sync -- [FLAGS]
```

---

## 🚩 Available Flags

### 1. `--no-details` (Recommended for Daily Use) 🛡️

**Purpose:** Updates core data without triggering the massive volume of individual player profile calls.

- **Saves:** ~300+ Biwenger API calls per run.
- **Use Case:** Daily updates of points, market values, and transfers.
- **What it Skips:** Detailed player bio (birthdate, height) and _full_ price history graph (it still updates _today's_ price).

| Table           | Status         | Notes                                                      |
| :-------------- | :------------- | :--------------------------------------------------------- |
| `players`       | ⚠️ **Partial** | Updates current price/points. **Skips** bio/price history. |
| `market_values` | ✅ **Updated** | Adds today's price entry.                                  |
| `transfers`     | ✅ **Updated** | Full sync.                                                 |
| `matches`       | ✅ **Updated** | Full sync.                                                 |
| `stats`         | ✅ **Updated** | Full sync.                                                 |

---

### 2. `--force-details` (Forced Update) 🔨

**Purpose:** Forces the script to check and update EVERY player's bio and price, ignoring the optimize-freshness check.

- **Use Case:** If you suspect bio data (height, weight, birthday) is missing or outdated despite running a sync.
- **Warning:** Adds significant time (~2-3 mins) as it fetches 350+ player details.

| Table     | Status         | Notes                                           |
| :-------- | :------------- | :---------------------------------------------- |
| `players` | ✅ **Updated** | Forces overwrite of birth_date, height, weight. |

---

### 3. `--active-only` (For Live Updates) ⚡🏀

**Purpose:** Ultra-fast sync designed for game nights. **Skips** the heavy core player database sync entirely.

- **Speed:** Runs in seconds instead of minutes.
- **Use Case:** Running multiple times during a game night to live-update scores and stats.
- **New Feature:** Now captures precise **Match Start Times** (e.g., `18:45`) for accurate countdowns.

| Table                | Status         | Notes                                                |
| :------------------- | :------------- | :--------------------------------------------------- |
| `matches`            | ⚠️ **Partial** | Updates scores/status for the **active round** only. |
| `player_round_stats` | ⚠️ **Partial** | Fetches live stats only for the **active round**.    |
| `players`            | ❌ **Skipped** | Does NOT check for price/bio updates.                |
| `fichajes`           | ❌ **Skipped** | Does NOT check for market transfers.                 |

---

### 4. `--only-market` (Fastest) ⚡

**Purpose:** Updates _only_ the transfer market and board. Ignores matches and stats.

- **Use Case:** frequent checks for new players on the market.

| Table           | Status           | Notes                                                |
| :-------------- | :--------------- | :--------------------------------------------------- |
| `fichajes`      | ✅ **Updated**   | Full sync.                                           |
| `transfer_bids` | ✅ **Updated**   | Full sync.                                           |
| `players`       | ℹ️ **Read-Only** | Fetches list for ID mapping but performs no updates. |
| `matches`       | ❌ **Skipped**   |                                                      |
| `stats`         | ❌ **Skipped**   |                                                      |

---

### 5. `--skip-euroleague` (Offline Mode) 📴

**Purpose:** Forces the script to use ONLY Biwenger data.

- **Use Case:** If the EuroLeague API is down or blocking connections.

| Table     | Status         | Notes                                                    |
| :-------- | :------------- | :------------------------------------------------------- |
| `matches` | ❌ **Skipped** | Dates/Scores come from EuroLeague, so they won't update. |
| `players` | ⚠️ **Partial** | No official height/weight/position updates.              |
| `stats`   | ❌ **Skipped** | No boxscore stats (Points, Rebounds, etc.).              |

---

### 6. `--only-round=<N>` (Targeted Fix) 🎯

**Purpose:** Forces a sync of a specific round ID (e.g., `4764`).

- **Use Case:** If a specific past round had errors or missing data.

```bash
npm run sync -- --only-round=4764
```

---

## 💡 Recommended Workflows

### 📅 Daily Routine (Morning)

Update everything but skip the heavy player details.

```bash
npm run sync -- --no-details
```

### 📺 Game Night (Live Scores)

Update only the active games to get latest scores.

```bash
npm run sync -- --active-only
```

_(Note: No need for `--no-details` as it is implied in active mode)_

### 🛠️ Full Rebuild (Missing Bio Data?)

If you notice missing heights/weights/birthdates, run this ONCE.

```bash
npm run sync -- --force-details
```

_(Warning: This makes ~350 calls to Biwenger. Do not run more than once per hour)._

---

## 🏗️ Architecture & Internals

The synchronization process has been modularized to ensure robustness, easier debugging, and maintainability.

### The `SyncManager`

At the core is the `SyncManager` class (`src/lib/sync/manager.js`). It orchestrates the entire process by:

1.  **Managing Context**: Holds the shared state (`db` connection, `playersList`, `teams` map, `competition` data) that travels between steps.
2.  **Executing Steps**: Runs registered sync modules sequentially.
3.  **Handling Errors**: Catches errors in individual steps without crashing the entire process (unless critical), and provides a consolidated summary at the end.
4.  **Logging**: Centralizes logs with timestamps and consistent formatting.

### Sync Steps

Each major data retrieval task is a self-contained module (a "Step") that implements a standard interface `(manager) => Promise<{ success, message }>`.

| Step Name           | Module                      | Responsibility                                                                            |
| :------------------ | :-------------------------- | :---------------------------------------------------------------------------------------- |
| **Initialize**      | `index.js` (inline)         | Ensures DB schema exists and migrates tables if needed.                                   |
| **Cleanup Rounds**  | `cleanup-rounds.js`         | Merges duplicate rounds (e.g., "Jornada 1" vs "Jornada 1 (aplazada)").                    |
| **Sync Players**    | `sync-players.js`           | Fetches the full player list. If standard mode, also fetches bio/prices for 300+ players. |
| **Sync Euroleague** | `sync-euroleague-master.js` | Fetches official team data from Euroleague API and links it to Biwenger IDs.              |
| **Sync Standings**  | `sync-standings.js`         | Updates user list and league table.                                                       |
| **Sync Squads**     | `sync-squads.js`            | Updates current player ownership for all users.                                           |
| **Sync Board**      | `sync-board.js`             | Processes the transfer market feed (sales, bids, purchases).                              |
| **Sync Initial**    | `sync-initial-squads.js`    | Infers original squads based on transfer history (Sales + Current - Bought).              |
| **Sync Matches**    | `sync-matches.js`           | Syncs match schedule (dates, scores) from Biwenger API.                                   |
| **Sync Stats**      | `sync-euroleague-stats.js`  | Fetches official boxscores (Points, Rebounds, PIR) for finished games.                    |
| **Sync Fantasy**    | `sync-euroleague-stats.js`  | Updates fantasy points from Biwenger for finished rounds.                                 |
| **Sync Lineups**    | `sync-lineups.js`           | Records user lineups and captain choices for finished rounds.                             |

### Data Flow

```mermaid
graph TD
    A[Start Sync] --> B{Args?};
    B -- --no-details --> C[Sync Players (Basic List)];
    B -- (Standard) --> D[Sync Players (Full Details)];
    C --> E[Sync Context Populated];
    D --> E;
    E --> F[Sync Euroleague Master];
    F --> G[Sync User Data (Standings, Squads, Board)];
    G --> H[Sync Matches & Stats];
    H --> I[Sync Lineups];
    I --> J[End];
```
