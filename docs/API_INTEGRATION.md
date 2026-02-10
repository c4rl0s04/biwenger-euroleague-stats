# Biwenger Stats - API Integration Reference

> **Technical Reference for Data Ingestion & Application APIs**
> This document details the external APIs consumed by the ETL pipeline and the internal APIs provided by the Next.js backend for the frontend.

## 🔄 Data Architecture

The application follows a **Local-First** architecture. The frontend **never** calls external APIs directly. All data is synchronized to a local PostgreSQL database via background jobs, and the frontend consumes this data via internal API routes.

```mermaid
graph LR
    Biwenger[Biwenger API] -->|Sync Scripts| DB[(PostgreSQL)]
    Euroleague[Euroleague API] -->|Sync Scripts| DB
    DB -->|Queries| InternalAPI[Internal Next.js API]
    InternalAPI -->|JSON| Frontend[React Components]
```

---

## 1. External APIs (Ingestion Source)

These endpoints are used **only** by the synchronization scripts in `src/lib/sync/`.

### 1.1. Biwenger API

**Base URL**: `https://biwenger.as.com/api/v2`
**Auth**: `Authorization: Bearer <TOKEN>` + headers

| Resource         | Endpoint                        | Purpose                    | Sync Step       |
| ---------------- | ------------------------------- | -------------------------- | --------------- |
| **Master Data**  | `/competitions/euroleague/data` | Players, Teams, Prices     | `01-players.js` |
| **League Board** | `/league/{id}/board`            | Transfers, Market Listings | `07-market.js`  |
| **Round Stats**  | `/rounds/league?scoreID={id}`   | Player points per round    | `05-stats.js`   |
| **User Lineups** | `/user/{id}?fields=lineup`      | Active user formations     | `06-lineups.js` |
| **Standings**    | `/league/{id}?fields=standings` | League table               | `04-rounds.js`  |

### 1.2. Euroleague API

**Base URL**: `https://live.euroleague.net/api`
**Auth**: Public

| Resource     | Endpoint                      | Purpose                        | Sync Step       |
| ------------ | ----------------------------- | ------------------------------ | --------------- |
| **Boxscore** | `/Header?gamecode={code}`     | Detailed stats (rebounds, etc) | `05-stats.js`   |
| **Schedule** | `/Schedules?seasoncode=E2025` | Season calendar                | `03-matches.js` |

---

## 2. Internal API (Application Backend)

These endpoints are provided by the `src/app/api` directory and are consumed by the frontend components.

**Base URL**: `/api`
**Response Format**:

```json
{
  "success": true,
  "data": { ... },
  "error": null // Only present on failure
}
```

### 2.1. Dashboard Endpoints

Located in `src/app/api/dashboard/`

| Endpoint                   | Method | Description               | Data Returned          |
| -------------------------- | ------ | ------------------------- | ---------------------- |
| `/dashboard/mvps`          | `GET`  | Last round's best players | Top 3 MVP cards        |
| `/dashboard/next-matches`  | `GET`  | Upcoming fixtures         | Grouped by day         |
| `/dashboard/ideal-lineup`  | `GET`  | Best possible team        | Players & total points |
| `/dashboard/rising-stars`  | `GET`  | Players improving form    | "Rising Stars" card    |
| `/dashboard/falling-stars` | `GET`  | Players losing form       | "Cold Streaks" card    |

### 2.2. Player & Market Analysis

Located in `src/app/api/player/` and `src/app/api/market/`

| Endpoint          | Method | Params               | Description                               |
| ----------------- | ------ | -------------------- | ----------------------------------------- |
| `/player/streaks` | `GET`  | -                    | Hot/Cold lists based on recent avg        |
| `/market/trends`  | `GET`  | `player_id`          | Price history graph data                  |
| `/market/snipers` | `GET`  | -                    | Undervalued players (High form/Low price) |
| `/stats/leaders`  | `GET`  | `type` (points, etc) | Statistical leaders board                 |

### 2.3. User & League Data

Located in `src/app/api/users/` and `src/app/api/standings/`

| Endpoint              | Method | Description                          |
| --------------------- | ------ | ------------------------------------ |
| `/users`              | `GET`  | List of all league members           |
| `/users/{id}/history` | `GET`  | User's performance history per round |
| `/standings`          | `GET`  | Current league table                 |
| `/compare/data`       | `GET`  | Head-to-head comparison data         |

### 2.4. Authentication

Located in `src/app/api/auth/`

| Endpoint        | Method | Description            |
| --------------- | ------ | ---------------------- |
| `/auth/login`   | `POST` | Admin login            |
| `/auth/session` | `GET`  | Verify current session |
| `/auth/logout`  | `POST` | Destroy session        |

---

## 3. Database Schema Mapping

Key tables populated by the sync process:

| Table                | Source                                     | Description                             |
| -------------------- | ------------------------------------------ | --------------------------------------- |
| `players`            | Biwenger Master Data                       | Static player info, team, current price |
| `player_round_stats` | Biwenger Round Stats + Euroleague Boxscore | Performance data per game               |
| `matches`            | Euroleague Schedule                        | Game dates, teams, results              |
| `market_entries`     | Biwenger Board                             | Daily market price snapshots            |
| `fichajes`           | Biwenger Board                             | Transfer history between users          |
| `users`              | Biwenger League                            | League participants info                |

For detailed schema, see `src/lib/db/schema.sql`.
