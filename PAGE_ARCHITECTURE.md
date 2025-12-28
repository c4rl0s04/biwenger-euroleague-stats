# Page Architecture Plan

Complete specification of all pages, their features, and required data sources.

---

## Database Capabilities Summary

| Table                | Key Data Available                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `users`              | id, name, icon                                                                               |
| `players`            | name, position, team, price, puntos, owner_id, price_increment, birth_date, home/away splits |
| `user_rounds`        | user points per round, participation status                                                  |
| `lineups`            | player in lineup, is_captain, role (starter/bench)                                           |
| `player_round_stats` | fantasy_points, real stats (points, rebounds, assists, etc.)                                 |
| `fichajes`           | transfer history (buyer, seller, price, timestamp)                                           |
| `matches`            | schedule, scores, home/away teams                                                            |
| `market_values`      | historical price per player                                                                  |
| `porras`             | predictions (aciertos)                                                                       |
| `initial_squads`     | starting squad at season begin                                                               |

---

## 1. Dashboard (`/dashboard`)

**Purpose:** Personal hub for the current user. Quick glance at their status.

### Current Cards (14)

| Card                  | Status | Data Source                  |
| --------------------- | ------ | ---------------------------- |
| MySeasonCard          | ✅     | user_rounds                  |
| SquadValueCard        | ✅     | players (owner)              |
| RecentRoundsCard      | ✅     | user_rounds                  |
| CaptainStatsCard      | ✅     | lineups + player_round_stats |
| LeaderGapCard         | ✅     | user_rounds (aggregated)     |
| HomeAwayCard          | ✅     | players (home/away splits)   |
| LeagueComparisonCard  | ✅     | user_rounds (vs league avg)  |
| NextRoundCard         | ✅     | matches                      |
| StandingsCard         | ✅     | user_rounds                  |
| TopPlayersCard        | ✅     | player_round_stats           |
| MarketActivityCard    | ✅     | fichajes                     |
| WeekMVPsCard          | ✅     | player_round_stats           |
| IdealLineupCard       | ✅     | player_round_stats           |
| StreakCard (hot/cold) | ✅     | player_round_stats           |
| BirthdayCard          | ✅     | players (birth_date)         |

### Proposed Additions

| Card               | Description                                                    | Feasibility                                      |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------ |
| **PorrasCard**     | User's prediction accuracy this season                         | ✅ `porras.aciertos`                             |
| **BenchValueCard** | Total value sitting on bench                                   | ✅ `lineups.role + players.price`                |
| **LostPointsCard** | Difference between max possible (all players) vs actual lineup | ⚠️ Needs lineup + player_round_stats calculation |

---

## 2. Standings (`/standings`)

**Purpose:** League-wide analytics. Compare all users.

### Current Cards (17)

| Card                       | Status                                |
| -------------------------- | ------------------------------------- |
| FullStandingsCard          | ✅ Complete standings table           |
| LeagueStatsCard            | ✅ Aggregate league stats             |
| RoundWinnersCard           | ✅ Who won each round                 |
| PointsProgressionCard      | ✅ Line chart of cumulative points    |
| RoundPointsProgressionCard | ✅ Per-round points chart             |
| ConsistencyCard            | ✅ Standard deviation of points       |
| PlacementStatsCard         | ✅ Top 3 / Bottom 3 finishes          |
| LeaguePerformanceCard      | ✅ Above/below average weeks          |
| EfficiencyCard             | ✅ Points per million €               |
| StreaksCard                | ✅ Win/loss streaks                   |
| BottlerCard                | ✅ Most 2nd/3rd without wins          |
| HeartbreakersCard          | ✅ Close losses (2nd by small margin) |
| NoGloryCard                | ✅ Zero wins despite playing          |
| JinxCard                   | ✅ Who you always lose to             |
| TeamValueRankingCard       | ✅ Squad values ranked                |
| InitialSquadAnalysisCard   | ✅ Compare current vs initial squad   |

### Proposed Additions (from your ideas)

#### ✅ Feasible - Data Available

| Card                      | Description                                        | Data Source                        |
| ------------------------- | -------------------------------------------------- | ---------------------------------- |
| **VolatilityCard**        | Std deviation ranking (already in ConsistencyCard) | `user_rounds`                      |
| **HypotheticalStandings** | "If everyone played every week"                    | `user_rounds` (avg missing rounds) |
| **Streak50PlusCard**      | Longest streak above 50 pts                        | `user_rounds.points`               |
| **ComebackKingCard**      | Biggest rank improvement from round X to now       | `user_rounds` position tracking    |
| **BestMonthCard**         | Who dominated each month                           | `user_rounds` grouped by month     |
| **PorrasLeaderboard**     | Who has most prediction accuracy                   | `porras.aciertos`                  |

#### ⚠️ Needs Calculation

| Card                 | Description                      | Complexity                            |
| -------------------- | -------------------------------- | ------------------------------------- |
| **NemesisCard**      | Who you finish behind most often | Medium - compare positions each round |
| **SeasonProjection** | Points needed to catch leader    | Simple math on remaining rounds       |

---

## 3. Players (`/players`) — **TO BUILD**

**Purpose:** Player discovery, search, and analysis. League-wide player database.

### Proposed Structure

#### Header Section

- Search bar (by name, team, position)
- Filters: Position, Team, Owner (All/Free/Mine), Price range

#### Featured Sections

| Card                    | Description                                | Data Source                          |
| ----------------------- | ------------------------------------------ | ------------------------------------ |
| **TopScorersList**      | Top 10 by total fantasy points             | `players.puntos`                     |
| **RisingStarsCard**     | Biggest price increases                    | `players.price_increment`            |
| **FallingStarsCard**    | Biggest price drops                        | `players.price_increment` (negative) |
| **BargainsCard**        | Best points-per-million ratio              | `players.puntos / players.price`     |
| **OneHitWondersCard**   | High single-round score but low total      | `player_round_stats` analysis        |
| **MostTransferredCard** | Players with most transfers                | `fichajes` count by player           |
| **TeamStatsCard**       | Average points by real-life team           | `players` grouped by team            |
| **PositionBreakdown**   | Best players by position                   | Filter by `players.position`         |
| **FreeAgentsCard**      | Top available players (`owner_id IS NULL`) | `players`                            |

#### Player Table

- Sortable columns: Points, Price, Price Change, Games Played
- Click to go to `/player/[id]`

---

## 4. Player Profile (`/player/[id]`)

**Purpose:** Deep dive into a single player.

### Current Cards (12)

| Card                    | Status                        |
| ----------------------- | ----------------------------- |
| PlayerIdentityCard      | ✅ Name, team, position       |
| PlayerBioCard           | ✅ Height, weight, birth date |
| PlayerStatsCard         | ✅ Season totals              |
| PlayerMarketCard        | ✅ Current price, increment   |
| PlayerAdvancedStatsCard | ✅ Per-game averages          |
| PlayerSplitsCard        | ✅ Home vs away performance   |
| PlayerNextMatchCard     | ✅ Upcoming game              |
| PlayerPointsGraph       | ✅ Points per round chart     |
| PlayerPriceHistoryCard  | ✅ Price over time            |
| PlayerOwnershipCard     | ✅ Current/past owners        |
| PlayerHistoryCard       | ✅ Round-by-round stats table |

### Proposed Additions

| Card                    | Description                           | Feasibility             |
| ----------------------- | ------------------------------------- | ----------------------- |
| **CaptainHistoryCard**  | How often player was captain + impact | ✅ `lineups.is_captain` |
| **SimilarPlayersCard**  | Players with similar stats/price      | ✅ Comparison query     |
| **TransferHistoryCard** | All buy/sell events for this player   | ✅ `fichajes.player_id` |

---

## 5. Market (`/market`)

**Purpose:** Transfer activity and trading analytics.

### Current Features

- 4 KPI cards (Total, Avg, Max, Active Buyers)
- Search + sortable transfers table

### Proposed Additions

| Card                          | Description                                             | Data Source                        |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------- |
| **BiggestSpendersCard**       | Users who spent most total                              | `fichajes` sum by `comprador`      |
| **BiggestSellersCard**        | Users who earned most from sales                        | `fichajes` sum by `vendedor`       |
| **MostBidWarCard**            | Transfers with most bids (if `transfer_bids` populated) | `transfer_bids`                    |
| **DailyMarketWinnersCard**    | Who gained most from price changes today                | `players.price_increment` by owner |
| **TradingVolumeChart**        | Transfers per week over season                          | `fichajes` grouped by week         |
| **AverageTransferByPosition** | Are strikers more expensive than goalkeepers?           | `fichajes + players.position`      |
| **MarketHeatmapCard**         | Which teams' players are traded most                    | `fichajes + players.team`          |

---

## 6. Matches (`/matches`) — **TO BUILD**

**Purpose:** Game schedule, results, and team performance.

### Proposed Structure

#### Header Section

- Round selector dropdown
- View toggle: Calendar / List / Results

#### Cards

| Card                     | Description                              | Data Source                       |
| ------------------------ | ---------------------------------------- | --------------------------------- |
| **UpcomingMatchesCard**  | Next X games with dates                  | `matches WHERE status='pending'`  |
| **RecentResultsCard**    | Last X finished games with scores        | `matches WHERE status='finished'` |
| **RoundScheduleCard**    | All games in selected round              | `matches WHERE round_id=X`        |
| **TeamFormCard**         | Win/loss streak by team                  | `matches` analysis                |
| **HighScoringGamesCard** | Games with most combined points          | `matches` ordered by total score  |
| **TopFantasyRoundCard**  | Which round produced most fantasy points | `player_round_stats` sum by round |

---

## 7. Lineups (`/lineups`) — **TO BUILD**

**Purpose:** Squad management and lineup analysis.

### Proposed Structure

#### For Current User

| Card                   | Description                           | Data Source                               |
| ---------------------- | ------------------------------------- | ----------------------------------------- |
| **CurrentLineupCard**  | Your active lineup with points        | `lineups` for current round               |
| **LineupHistoryCard**  | Your lineups over past rounds         | `lineups` all rounds                      |
| **CaptainSuccessCard** | Captain choices and their points      | `lineups.is_captain + player_round_stats` |
| **BenchImpactCard**    | Points left on bench each round       | Compare bench vs starters                 |
| **OptimalLineupCard**  | What your best lineup would have been | `player_round_stats` for owned players    |

#### League-Wide

| Card                  | Description                         | Data Source                    |
| --------------------- | ----------------------------------- | ------------------------------ |
| **MostCaptainedCard** | Top captained players in league     | `lineups.is_captain` count     |
| **MostStartedCard**   | Players that appear in most lineups | `lineups.role='starter'` count |
| **SquadOverlapCard**  | Who shares most players with you    | Compare lineups                |

---

## Implementation Priority

### Phase 1: Complete Missing Pages

1. `/players` - Player directory with search/filters
2. `/matches` - Schedule and results
3. `/lineups` - Squad analysis

### Phase 2: Enhance Existing Pages

1. Standings: Add Comeback King, Best Month, Nemesis
2. Dashboard: Add Porras card, Bench Value
3. Market: Add spending/selling leaderboards

### Phase 3: Advanced Features

1. Head-to-head comparisons
2. Season projections
3. Historical data (previous seasons)

---

## User Review Required

> [!IMPORTANT]
> Please review this plan and provide feedback:
>
> 1. Which pages/cards are highest priority?
> 2. Any features to add or remove?
> 3. Should we proceed with Phase 1 first?
