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
*   **Saves:** ~300+ Biwenger API calls per run.
*   **Use Case:** Daily updates of points, market values, and transfers.
*   **What it Skips:** Detailed player bio (birthdate, height) and *full* price history graph (it still updates *today's* price).

| Table | Status | Notes |
| :--- | :--- | :--- |
| `players` | ⚠️ **Partial** | Updates current price/points. **Skips** bio/price history. |
| `market_values` | ✅ **Updated** | Adds today's price entry. |
| `transfers` | ✅ **Updated** | Full sync. |
| `matches` | ✅ **Updated** | Full sync. |
| `stats` | ✅ **Updated** | Full sync. |

---

### 2. `--force-details` (Forced Update) 🔨
**Purpose:** Forces the script to check and update EVERY player's bio and price, ignoring the optimize-freshness check.
*   **Use Case:** If you suspect bio data (height, weight, birthday) is missing or outdated despite running a sync.
*   **Warning:** Adds significant time (~2-3 mins) as it fetches 350+ player details.

| Table | Status | Notes |
| :--- | :--- | :--- |
| `players` | ✅ **Updated** | Forces overwrite of birth_date, height, weight. |

---

### 3. `--active-only` (For Game Nights) 🏀
**Purpose:** Syncs only the *current* or *upcoming* matches. Skips checking 100+ finished games.
*   **Saves:** ~300 EuroLeague API calls (depending on season progress).
*   **Use Case:** Running multiple times during a game night to get live scores.

| Table | Status | Notes |
| :--- | :--- | :--- |
| `matches` | ⚠️ **Partial** | Updates only games that are NOT finished or are LIVE. |
| `player_round_stats`| ⚠️ **Partial** | Skips boxscore fetch for finished games. |
| `players` | ✅ **Updated** | Full sync (unless combined with `--no-details`). |

---

### 4. `--only-market` (Fastest) ⚡
**Purpose:** Updates *only* the transfer market and board. Ignores matches and stats.
*   **Use Case:** frequent checks for new players on the market.

| Table | Status | Notes |
| :--- | :--- | :--- |
| `fichajes` | ✅ **Updated** | Full sync. |
| `transfer_bids` | ✅ **Updated** | Full sync. |
| `players` | ℹ️ **Read-Only** | Fetches list for ID mapping but performs no updates. |
| `matches` | ❌ **Skipped** | |
| `stats` | ❌ **Skipped** | |

---

### 5. `--skip-euroleague` (Offline Mode) 📴
**Purpose:** Forces the script to use ONLY Biwenger data.
*   **Use Case:** If the EuroLeague API is down or blocking connections.

| Table | Status | Notes |
| :--- | :--- | :--- |
| `matches` | ❌ **Skipped** | Dates/Scores come from EuroLeague, so they won't update. |
| `players` | ⚠️ **Partial** | No official height/weight/position updates. |
| `stats` | ❌ **Skipped** | No boxscore stats (Points, Rebounds, etc.). |

---

### 6. `--only-round=<N>` (Targeted Fix) 🎯
**Purpose:** Forces a sync of a specific round ID (e.g., `4764`).
*   **Use Case:** If a specific past round had errors or missing data.

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
npm run sync -- --no-details --active-only
```

### 🛠️ Full Rebuild (Missing Bio Data?)
If you notice missing heights/weights/birthdates, run this ONCE.
```bash
npm run sync -- --force-details
```
*(Warning: This makes ~350 calls to Biwenger. Do not run more than once per hour).*
