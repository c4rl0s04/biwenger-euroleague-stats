# Biwenger Stats API Documentation

Complete reference for all API endpoints in the Biwenger Stats application.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Response Format

All endpoints return JSON with a standard envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Caching

Responses include `Cache-Control` headers:

- `SHORT` (60s): Frequently changing data
- `MEDIUM` (300s): Dashboard data
- `LONG` (900s): Analytics/standings

---

## Dashboard Endpoints

### GET `/api/dashboard/standings-preview`

Returns top 5 standings for dashboard preview.

**Response:**

```json
{
  "standings": [{ "user_id": 1, "name": "User1", "total_points": 1500, "position": 1 }],
  "total_users": 8
}
```

---

### GET `/api/dashboard/top-players`

Returns top performing players this season.

**Response:**

```json
[{ "id": 1, "name": "Player Name", "team": "Team", "points": 250, "average": 20.5 }]
```

---

### GET `/api/dashboard/mvps`

Returns round MVPs (highest scorers per round).

**Response:**

```json
[{ "round_id": 10, "round_name": "Jornada 10", "player_name": "Player", "points": 35 }]
```

---

### GET `/api/dashboard/birthdays`

Returns players with upcoming birthdays.

**Response:**

```json
[{ "id": 1, "name": "Player", "team": "Team", "birthday": "1995-03-15", "age": 29 }]
```

---

### GET `/api/dashboard/rising-stars`

Returns players with best recent form.

**Response:**

```json
[{ "id": 1, "name": "Player", "avg_recent": 25.5, "trend": "up" }]
```

---

### GET `/api/dashboard/next-round`

Returns information about the upcoming round.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | User ID for personalized data |

**Response:**

```json
{
  "round_id": 15,
  "round_name": "Jornada 15",
  "matches": [...],
  "user_squad": [...]
}
```

---

### GET `/api/dashboard/recent-activity`

Returns recent transfers and market activity.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `userId` | number | - | Filter by user |
| `limit` | number | 10 | Max results |

---

### GET `/api/dashboard/leader-gap`

Returns gap between user and league leader.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Required - User to compare |

---

### GET `/api/dashboard/captain-stats`

Returns captain performance statistics.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Required - User ID |

---

### GET `/api/dashboard/home-away`

Returns home/away performance split.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Required - User ID |

---

### GET `/api/dashboard/ideal-lineup`

Returns best possible lineup for user's squad.

---

## Standings Endpoints

### GET `/api/standings/full`

Returns complete standings with all statistics.

**Response:**

```json
[
  {
    "user_id": 1,
    "name": "User",
    "position": 1,
    "total_points": 1500,
    "rounds_played": 15,
    "avg_points": 100,
    "round_wins": 5,
    "team_value": 50000000
  }
]
```

---

### GET `/api/standings/points-progression`

Returns cumulative points across rounds for charting.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Number of rounds |

---

### GET `/api/standings/round-winners`

Returns history of round winners.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 15 | Number of rounds |

---

### GET `/api/standings/league-totals`

Returns aggregate league statistics.

**Response:**

```json
{
  "total_points": 50000,
  "total_rounds": 15,
  "avg_round_points": 800,
  "most_valuable_user": { "name": "User", "team_value": 60000000 }
}
```

---

### GET `/api/standings/value-ranking`

Returns users ranked by squad value.

---

### GET `/api/standings/streaks`

Returns hot and cold streaks.

---

### GET `/api/standings/volatility`

Returns consistency/volatility rankings.

---

### GET `/api/standings/efficiency`

Returns points efficiency (points per value spent).

---

### GET `/api/standings/placements`

Returns placement distribution per user.

---

### GET `/api/standings/bottlers`

Returns users who underperform with good squads.

---

### GET `/api/standings/heartbreakers`

Returns users with most second-place finishes.

---

### GET `/api/standings/no-glory`

Returns users with most last-place finishes.

---

### GET `/api/standings/jinx`

Returns users with worst luck statistics.

---

### GET `/api/standings/analytics`

Returns initial squad analysis.

---

### GET `/api/standings/league-comparison`

Returns league average for comparison.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | User to compare |

---

## Player Endpoints

### GET `/api/player/stats`

Returns detailed player statistics.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | number | Required - Player ID |

---

### GET `/api/player/rounds`

Returns player's round-by-round performance.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | number | Required - Player ID |

---

### GET `/api/player/squad`

Returns user's current squad.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Required - User ID |

---

### GET `/api/player/streaks`

Returns player hot/cold streaks.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | number | Required - Player ID |

---

## Market Endpoints

### GET `/api/market`

Returns recent market activity and transfers.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max results |
| `type` | string | all | Filter: `buy`, `sell`, `all` |

---

## Utility Endpoints

### GET `/api/league-average`

Returns overall league average points.

---

## Error Codes

| Status | Description                        |
| ------ | ---------------------------------- |
| 200    | Success                            |
| 400    | Bad Request - Invalid parameters   |
| 404    | Not Found - Resource doesn't exist |
| 500    | Server Error - Internal error      |

---

## Examples

### Fetch standings with curl

```bash
curl http://localhost:3000/api/standings/full
```

### Fetch user dashboard data

```bash
curl "http://localhost:3000/api/dashboard/captain-stats?userId=123"
```

### Fetch market with limit

```bash
curl "http://localhost:3000/api/market?limit=20&type=buy"
```
