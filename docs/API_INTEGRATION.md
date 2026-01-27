# Biwenger Stats - API Integration Reference

> **Technical Reference for Data Ingestion Pipeline**
> This document details every external API endpoint consumed by the application, the exact JSON structure returned, and how each field is mapped to the internal PostgreSQL database.

---

## 1. Biwenger API

**Base URL**: `https://biwenger.as.com/api/v2`
**Auth**: `Authorization: Bearer <TOKEN>` + `X-League: <ID>` + `X-User: <ID>`

### 1.1. Master Player Data

**Endpoint**: `GET /competitions/euroleague/data?lang=es`
**Context**: `src/lib/sync/steps/01-players.js`
**Purpose**: Fetches the official list of all players, teams, and current prices.

**Response Structure (JSON)**:

```json
{
  "data": {
    "players": {
      "12345": {
        "id": 12345,
        "name": "Mike James",
        "slug": "mike-james",
        "teamID": 25,
        "position": 1,
        "price": 1800000,
        "fitness": [5, 4, 3, 5, 5],
        "points": 156,
        "played": 12,
        "status": "ok"
      }
    },
    "teams": {
      "25": {
        "id": 25,
        "name": "AS Monaco",
        "shortName": "ASM",
        "img": "http://..."
      }
    }
  }
}
```

**Database Mapping (`players` table)**:
| JSON Path | DB Column | Type | Transformation |
|---|---|---|---|
| `id` | `id` | INT | PK |
| `name` | `name` | TEXT | Encoded as UTF-8 |
| `teamID` | `team_id` | INT | FK to `teams` |
| `position` | `position` | INT | Direct map (1=PG...5=C) |
| `price` | `price` | BIGINT | Current value |
| `points` | `puntos` | INT | Season total |

---

### 1.2. League Board (Market & Transfers)

**Endpoint**: `GET /league/board?offset=0&limit=40`
**Context**: `src/lib/sync/steps/07-market.js`
**Purpose**: Fetches the news feed to detect transfers, free agent signings, and market listings.

**Response Structure**:

```json
{
  "data": [
    {
      "type": "transfer",
      "date": 1769515200,
      "content": {
        "amount": 2000000,
        "from": { "id": 101, "name": "User A" },
        "to": { "id": 102, "name": "User B" },
        "player": { "id": 555, "name": "Tavares" }
      }
    },
    {
      "type": "market",
      "date": 1769515210,
      "content": {
        "player": { "id": 555 },
        "price": 1500000
      }
    }
  ]
}
```

**Database Mapping (`fichajes` table)**:
| JSON Path | DB Column | Notes |
|---|---|---|
| `content.player.id` | `player_id` | - |
| `content.amount` | `price` | Transfer fee |
| `content.from.name` | `vendedor` | 'Mercado' if null |
| `content.to.name` | `comprador` | 'Mercado' if null |
| `date` | `timestamp` | Stored as UNIX timestamp |

---

### 1.3. User Lineup

**Endpoint**: `GET /user/{userId}?fields=lineup`
**Context**: `src/lib/sync/steps/06-lineups.js`
**Purpose**: Fetches the active lineup for a user in the _current_ round.

**Response Structure**:

```json
{
  "data": {
    "lineup": {
      "eleven": [123, 456, 789], // Starter IDs
      "bench": [111],
      "captain": 123
    }
  }
}
```

**Database Mapping (`lineups` table)**:
| Field | DB Column | Logic |
|---|---|---|
| `eleven[]` | `player_id` | Inserted with role='titular' |
| `bench[]` | `player_id` | Inserted with role='bench' |
| `captain` | `is_captain` | Boolean flag (true for ID 123) |

---

### 1.4. Round Stats

**Endpoint**: `GET /rounds/league?scoreID={scoreID}`
**Context**: `src/lib/sync/steps/05-stats.js`
**Purpose**: Fetches Biwenger fantasy points for _all_ players in a completed round.

**Response Structure**:

```json
{
  "data": {
    "12345": { "points": 25, "played": true }, // Player 1
    "67890": { "points": 10, "played": true } // Player 2
  }
}
```

**Database Mapping (`player_round_stats` table)**:
| Field | DB Column |
|---|---|
| `data[id].points` | `fantasy_points` |

---

## 2. Euroleague API

**Base URL**: `https://live.euroleague.net/api`
**Auth**: None (Public)

### 2.1. Boxscore (Stats)

**Endpoint**: `GET /Header?gamecode={code}&seasoncode=E2025`
**Context**: `src/lib/sync/steps/05-stats.js`
**Purpose**: High-fidelity basketball stats (rebounds, assists, etc).

**Response Structure**:

```json
{
  "Stats": [
    {
      "Team": "MAD",
      "PlayersStats": [
        {
          "Player_ID": "P00666",
          "Points": 15,
          "TotalRebounds": 10,
          "Assistances": 5,
          "Valuation": 25,
          "Minutes": "30:15"
        }
      ]
    }
  ]
}
```

**Database Mapping (`player_round_stats` table)**:
_Matched via `player_mappings` table._

| JSON Path       | DB Column   | Transformation |
| --------------- | ----------- | -------------- |
| `Points`        | `points`    | -              |
| `TotalRebounds` | `rebounds`  | -              |
| `Assistances`   | `assists`   | -              |
| `Valuation`     | `valuation` | -              |
| `Minutes`       | `minutes`   | "30:15" -> 30  |

---

### 2.2. Schedule & Seasons

**Endpoint**: `GET /Schedules?seasoncode=E2025`
**Context**: `src/lib/sync/steps/03-matches.js`
**Purpose**: Master schedule of all games, dates, and rounds.

**Response Structure**:

```json
{
  "gamedays": [
    {
      "round": 1,
      "games": [
        {
          "gamecode": 1,
          "hometeam": "MAD",
          "awayteam": "BAR",
          "date": "2025-10-05",
          "time": "20:30"
        }
      ]
    }
  ]
}
```

**Database Mapping (`matches` table)**:
| Field | DB Column |
|---|---|
| `gamecode` | `id` |
| `round` | `round_id` |
| `date` + `time` | `date` (Timestamp) |
| `hometeam` | `home_team_id` (via Lookup) |
| `awayteam` | `away_team_id` (via Lookup) |
