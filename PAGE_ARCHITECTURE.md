# Page Architecture Plan

Complete specification of all pages, their features, and required data sources.

---

## Database Capabilities Summary

| Table                | Key Data Available                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `users`              | id, name, icon                                                                                       |
| `players`            | name, position, team, price, puntos, owner_id, price_increment, birth_date, status, home/away splits |
| `user_rounds`        | user points per round, participation status                                                          |
| `lineups`            | player in lineup, is_captain, role (starter/bench)                                                   |
| `player_round_stats` | fantasy_points, real stats (points, rebounds, assists, etc.)                                         |
| `fichajes`           | transfer history (buyer, seller, price, timestamp)                                                   |
| `matches`            | schedule, scores, home/away teams                                                                    |
| `market_values`      | historical price per player                                                                          |
| `porras`             | predictions (aciertos)                                                                               |
| `initial_squads`     | starting squad at season begin                                                                       |
| `finances`           | user budget/cash (if tracked)                                                                        |

---

## Statistics Catalog

All statistics organized by category with feasibility assessment.

### 🌟 Performance & Consistency

| Statistic                 | Description                            | Data Source                       | Status                                 |
| ------------------------- | -------------------------------------- | --------------------------------- | -------------------------------------- |
| Weekly Volatility         | Standard deviation of points per round | `user_rounds.points`              | ✅ Implemented (ConsistencyCard)       |
| Top 3 / Bottom 3 Count    | Podium vs relegation zone finishes     | `user_rounds` position per round  | ✅ Implemented (PlacementStatsCard)    |
| Above/Below Average Weeks | % of weeks above league average        | `user_rounds` vs avg              | ✅ Implemented (LeaguePerformanceCard) |
| Points per Million        | Total points / team value              | `user_rounds + players.price`     | ✅ Implemented (EfficiencyCard)        |
| Hypothetical Standings    | "If everyone played every week"        | `user_rounds` with avg for missed | ⏳ To Build                            |
| Streak 50+ Rounds         | Longest streak above threshold         | `user_rounds.points`              | ⏳ To Build                            |
| Bottler Metric            | Most 2nd/3rd without wins              | `user_rounds` positions           | ✅ Implemented (BottlerCard)           |

---

### 💰 Economy & Team Value

| Statistic                      | Description                            | Data Source                            | Status                  |
| ------------------------------ | -------------------------------------- | -------------------------------------- | ----------------------- |
| Squad Value Growth Rate        | Team value increase since season start | `initial_squads + players.price`       | ⏳ To Build             |
| Bench Value                    | Total value of bench players           | `lineups.role='bench' + players.price` | ⏳ To Build (Dashboard) |
| Most Expensive Player per Team | Each user's star player (bubble chart) | `players` grouped by owner             | ⏳ To Build             |
| Cash Hoarders                  | Ranking by available balance           | `finances` (if available)              | ❓ Needs data           |
| Daily Market Winners           | Most gained from price increases       | `players.price_increment` by owner     | ⏳ To Build (Market)    |
| Average Player Value           | Team value / squad size                | `players` by owner                     | ⏳ To Build             |

---

### 🏟️ Squad & Composition

| Statistic            | Description                             | Data Source                     | Status                         |
| -------------------- | --------------------------------------- | ------------------------------- | ------------------------------ |
| Squad Composition    | Breakdown by position (pie chart)       | `players.position` by owner     | ⏳ To Build                    |
| Team Dependency      | % value in top 3 players                | `players.price` top 3 per owner | ⏳ To Build                    |
| Most Owned Real Team | Who owns most Real Madrid players, etc. | `players.team` by owner         | ⏳ To Build                    |
| Injury Crisis        | Count of injured/doubtful players       | `players.status`                | ✅ Feasible (if status synced) |

---

### ⚔️ Head-to-Head & Rivals

| Statistic    | Description                       | Data Source                                             | Status      |
| ------------ | --------------------------------- | ------------------------------------------------------- | ----------- |
| The Nemesis  | User you finish behind most often | `user_rounds` position comparison                       | ⏳ To Build |
| Gap Analysis | Points needed to catch leader     | Simple math: `(leader_pts - my_pts) / remaining_rounds` | ⏳ To Build |
| Mini-Leagues | Top 4 vs Bottom 4 groupings       | `user_rounds` aggregated                                | ⏳ To Build |

---

### 📅 Time-Based / History

| Statistic             | Description                          | Data Source                           | Status                           |
| --------------------- | ------------------------------------ | ------------------------------------- | -------------------------------- |
| Best Month            | Monthly winner breakdown             | `user_rounds` grouped by month        | ⏳ To Build                      |
| Comeback King         | Biggest rank improvement             | Position at round X vs now            | ⏳ To Build                      |
| Ideal Lineup (League) | Team of the Season by position       | `player_round_stats` top per position | ✅ Implemented (IdealLineupCard) |
| Lost Points           | Potential max - actual (bench waste) | `lineups + player_round_stats`        | ⏳ To Build                      |
| One Hit Wonders       | High single-round, low total         | `player_round_stats` max vs sum       | ⏳ To Build (Players page)       |

---

## 1. Dashboard (`/dashboard`)

**Purpose:** Personal hub for the current user. Quick glance at their status.

### Current Cards (14)

| Card                  | Data Source                  |
| --------------------- | ---------------------------- |
| MySeasonCard          | user_rounds                  |
| SquadValueCard        | players (owner)              |
| RecentRoundsCard      | user_rounds                  |
| CaptainStatsCard      | lineups + player_round_stats |
| LeaderGapCard         | user_rounds (aggregated)     |
| HomeAwayCard          | players (home/away splits)   |
| LeagueComparisonCard  | user_rounds (vs league avg)  |
| NextRoundCard         | matches                      |
| StandingsCard         | user_rounds                  |
| TopPlayersCard        | player_round_stats           |
| MarketActivityCard    | fichajes                     |
| WeekMVPsCard          | player_round_stats           |
| IdealLineupCard       | player_round_stats           |
| StreakCard (hot/cold) | player_round_stats           |
| BirthdayCard          | players (birth_date)         |

### Proposed Additions

| Card                 | Description                     | Priority |
| -------------------- | ------------------------------- | -------- |
| **PorrasCard**       | Prediction accuracy this season | Medium   |
| **BenchValueCard**   | Total value on bench            | High     |
| **LostPointsCard**   | Points wasted on bench          | Medium   |
| **InjuryCrisisCard** | Injured players in your squad   | Low      |

---

## 2. Standings (`/standings`)

**Purpose:** League-wide analytics. Compare all users.

### Current Cards (16)

- FullStandingsCard, LeagueStatsCard, RoundWinnersCard
- PointsProgressionCard, RoundPointsProgressionCard
- ConsistencyCard (Volatility), PlacementStatsCard (Top3/Bottom3)
- LeaguePerformanceCard (Above/Below Avg), EfficiencyCard (Points/Million)
- StreaksCard, BottlerCard, HeartbreakersCard, NoGloryCard
- JinxCard, TeamValueRankingCard, InitialSquadAnalysisCard

### Proposed Additions

| Card                          | Description                   | Priority |
| ----------------------------- | ----------------------------- | -------- |
| **HypotheticalStandingsCard** | If everyone played every week | High     |
| **Streak50PlusCard**          | Longest streak above 50 pts   | Medium   |
| **ComebackKingCard**          | Biggest rank improvement      | High     |
| **BestMonthCard**             | Monthly winners               | Medium   |
| **NemesisCard**               | User you lose to most         | High     |
| **GapAnalysisCard**           | Points needed to catch leader | Medium   |
| **MiniLeaguesCard**           | Top 4 vs Bottom 4 battle      | Low      |
| **SquadValueGrowthCard**      | Value increase since start    | Medium   |
| **TeamDependencyCard**        | % value in top 3 players      | Low      |

---

## 3. Players (`/players`) — **TO BUILD**

**Purpose:** Player discovery, search, and analysis.

### Structure

**Header:** Search bar + Filters (Position, Team, Owner, Price range)

### Cards

| Card                    | Description                  |
| ----------------------- | ---------------------------- |
| **TopScorersList**      | Top 10 by fantasy points     |
| **RisingStarsCard**     | Biggest price increases      |
| **FallingStarsCard**    | Biggest price drops          |
| **BargainsCard**        | Best points-per-million      |
| **OneHitWondersCard**   | High single-round, low total |
| **MostTransferredCard** | Players with most transfers  |
| **TeamStatsCard**       | Average points by real team  |
| **FreeAgentsCard**      | Top available players        |
| **PositionBreakdown**   | Best by position             |

### Player Table

Sortable: Points, Price, Price Change, Games Played → Links to `/player/[id]`

---

## 4. Player Profile (`/player/[id]`)

**Purpose:** Deep dive into a single player.

### Current Cards (11)

PlayerIdentityCard, PlayerBioCard, PlayerStatsCard, PlayerMarketCard,
PlayerAdvancedStatsCard, PlayerSplitsCard, PlayerNextMatchCard,
PlayerPointsGraph, PlayerPriceHistoryCard, PlayerOwnershipCard, PlayerHistoryCard

### Proposed Additions

| Card                    | Description                      |
| ----------------------- | -------------------------------- |
| **CaptainHistoryCard**  | How often captained + impact     |
| **SimilarPlayersCard**  | Players with similar stats/price |
| **TransferHistoryCard** | All buy/sell events              |

---

## 5. Market (`/market`)

**Purpose:** Transfer activity and trading analytics.

### Current Features

4 KPI cards + Search + Sortable transfers table

### Proposed Additions

| Card                          | Description                        |
| ----------------------------- | ---------------------------------- |
| **BiggestSpendersCard**       | Users who spent most               |
| **BiggestSellersCard**        | Users who earned most              |
| **DailyMarketWinnersCard**    | Who gained most from price changes |
| **TradingVolumeChart**        | Transfers per week                 |
| **AverageTransferByPosition** | Price by position                  |
| **MarketHeatmapCard**         | Which teams traded most            |
| **MostBidWarCard**            | Transfers with most bids           |

---

## 6. Matches (`/matches`) — **TO BUILD**

**Purpose:** Game schedule, results, and team performance.

### Structure

**Header:** Round selector + View toggle (Calendar/List/Results)

### Cards

| Card                     | Description                    |
| ------------------------ | ------------------------------ |
| **UpcomingMatchesCard**  | Next games with dates          |
| **RecentResultsCard**    | Last finished games            |
| **RoundScheduleCard**    | All games in round             |
| **TeamFormCard**         | Win/loss streak by team        |
| **HighScoringGamesCard** | Most combined points           |
| **TopFantasyRoundCard**  | Round with most fantasy points |

---

## 7. Lineups (`/lineups`) — **TO BUILD**

**Purpose:** Squad management and lineup analysis.

### For Current User

| Card                   | Description               |
| ---------------------- | ------------------------- |
| **CurrentLineupCard**  | Active lineup with points |
| **LineupHistoryCard**  | Past round lineups        |
| **CaptainSuccessCard** | Captain choices + impact  |
| **BenchImpactCard**    | Points left on bench      |
| **OptimalLineupCard**  | Best possible lineup      |
| **LostPointsCard**     | Wasted bench points total |

### League-Wide

| Card                  | Description             |
| --------------------- | ----------------------- |
| **MostCaptainedCard** | Top captained players   |
| **MostStartedCard**   | Most used players       |
| **SquadOverlapCard**  | Who shares most players |

---

## Implementation Priority

### Phase 1: Build Missing Pages

1. `/players` - Player directory with search/filters
2. `/matches` - Schedule and results
3. `/lineups` - Squad analysis

### Phase 2: Add High-Priority Stats

1. Standings: HypotheticalStandings, ComebackKing, Nemesis
2. Dashboard: BenchValue, PorrasCard
3. Market: Spenders/Sellers leaderboards

### Phase 3: Add Medium-Priority Stats

1. Streak50Plus, BestMonth, GapAnalysis
2. SquadValueGrowth, TeamDependency
3. OneHitWonders, DailyMarketWinners

### Phase 4: Advanced Features

1. Mini-Leagues groups
2. Historical comparisons
3. Season projections
