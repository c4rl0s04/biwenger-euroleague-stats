# External API Documentation

This project integrates data from two primary sources: the **Euroleague Official API** and the **Biwenger API**.

## 1. Euroleague API

The project uses a mix of the modern V1 API (XML-based) and a Legacy API (JSON-based) to retrieve official stats, schedules, and team data.

### Configuration

- **Season Code**: `E2025` (Configured in `src/lib/config.js`)
- **V1 Base URL**: `https://api-live.euroleague.net`
- **Legacy Base URL**: `https://live.euroleague.net/api`

### Endpoints

#### 1.1. Season Schedule

- **Method**: `GET`
- **URL**: `{V1_BASE_URL}/v1/schedules?seasonCode={SEASON}&competitionCode=E`
- **Format**: XML
- **Usage**: Fetches all games for the season to determine game dates, rounds, and matchups.
- **Key Fields**:
  - `gamecode`: ID used for other calls (e.g., `E2024_1`)
  - `round`: Round name (e.g., `RS`, `PO`)
  - `gameday`: Round number
  - `hometeam` / `awayteam`: Team names
  - `date` / `startime`: Game schedule

#### 1.2. Teams & Rosters

- **Method**: `GET`
- **URL**: `{V1_BASE_URL}/v1/teams?seasonCode={SEASON}&competitionCode=E`
- **Format**: XML
- **Usage**: Retrieves list of teams and their full player rosters (names, dorsals, positions).
- **Key Fields**:
  - `code`: 3-letter team code (e.g., `MAD`)
  - `name`: Team name
  - `roster.player`: List of players

#### 1.3. Game Box Score (Legacy)

- **Method**: `GET`
- **URL**: `{LEGACY_BASE_URL}/Boxscore?gamecode={GAME_NUMBER}&seasoncode={SEASON}`
- **Format**: JSON
- **Usage**: Retrieves detailed player statistics for a completed game.
- **Key Fields**:
  - `Stats`: Array of team stats
  - `Stats[].PlayersStats`: Array of player performance records
    - `Player`: Player name
    - `Player_ID`: Euroleague internal ID
    - `Minutes`, `Points`, `TotalRebounds`, `Assistances`, `Valuation` (PIR)

#### 1.4. Game Header (Legacy)

- **Method**: `GET`
- **URL**: `{LEGACY_BASE_URL}/Header?gamecode={GAME_NUMBER}&seasoncode={SEASON}`
- **Format**: JSON
- **Usage**: Retrieves game metadata like final score, quarter scores, and status.

---

## 2. Biwenger API

The Biwenger API is used to manage the fantasy league aspects: user teams, market values, and scoring system updates.

### Configuration

- **Base URL**: `https://biwenger.as.com/api/v2`
- **Auth**: Requires `Bearer` token (`BIWENGER_TOKEN`) and specific headers (`x-league`, `x-user`, `x-version`).

### Endpoints

#### 2.1. Competition Data

- **Method**: `GET`
- **URL**: `/competitions/euroleague/data?lang=es`
- **Usage**: Retrieves static data about the Euroleague competition in Biwenger (teams, rounds).

#### 2.2. League Standings

- **Method**: `GET`
- **URL**: `/league/{LEAGUE_ID}?fields=standings`
- **Usage**: Fetches current league standings, total points, and team values.

#### 2.3. League Board (News Feed)

- **Method**: `GET`
- **URL**: `/league/{LEAGUE_ID}/board?offset={OFFSET}&limit={LIMIT}`
- **Usage**: Retrieves the league's activity feed (transfers, market moves, round results). Vital for syncing:
  - **Transfers**: Detecting changes in player ownership.
  - **Market**: Tracking when players appear on the market.
  - **Round Finished**: Triggering score syncs.

#### 2.4. Round Games

- **Method**: `GET`
- **URL**: `/rounds/euroleague/{ROUND_ID}?score=1&v=629`
- **Usage**: Gets Biwenger's view of a round's matches and scores.

#### 2.5. Player Details

- **Method**: `GET`
- **URL**: `/players/euroleague/{PLAYER_ID}?lang=es&fields=prices,birthday,height,weight`
- **Usage**: Fetches detailed bio and market value history for a specific player. This is the **authoritative source** for bio data (`birth_date`, `height`, `weight`, `position`).

#### 2.6. User Players

- **Method**: `GET`
- **URL**: `/user/{USER_ID}?fields=players`
- **Usage**: Retrieves the current roster (players owned) by a specific user.
