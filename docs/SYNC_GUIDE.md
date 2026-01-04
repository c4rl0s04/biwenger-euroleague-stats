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
