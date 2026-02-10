# Biwenger Stats - Features & Statistics

This document catalogs the analytics modules available in the application.

## 🏠 Dashboard (`/dashboard`)

The command center for your fantasy team.

| Feature             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| **Season Stats**    | Overview of your total points, average, and rank.           |
| **Next Round**      | Schedule helper showing your players with upcoming games.   |
| **Captain Stats**   | Analysis of your captain choices and their success.         |
| **Squad Value**     | Tracks your team's total market value over time.            |
| **Market Activity** | Feed of recent transfers, bids, and listings in the league. |
| **Rising Stars**    | Players in your squad with increasing value/form.           |
| **Top Players**     | Your best performing players by total points.               |

## 🏆 Standings & Analytics (`/standings`)

Comprehensive league analysis divided into categories.

### 1. General & League

- **League Stats**: Averages for points, squad value, and transfers.
- **Round Winners**: History of who won each round.
- **Dominance**: Margin of victory analysis.

### 2. Performance Metrics

- **Rolling Average**: 3-round moving average to show form trends.
- **Points Progression**: Cumulative points chart for race visualization.
- **Floor & Ceiling**: Max/Min scores to show potential vs safety.
- **Volatility**: Standard deviation of scores (Consistency).
- **Point Distribution**: Histogram of scores (frequency of high/low rounds).

### 3. "Fun" Statistics

- **Heat Check**: Who is currently "on fire".
  - _Logic_: `(Avg Points Last 5 Rounds) - (Season Avg Points)`.
- **The Hunter**: Tracking the chase.
  - _Logic_: Points gained or lost against the current league leader over the last 5 rounds.
- **Bottler Score**: Metric for teams that finish 2nd/3rd often but rarely win.
  - _Formula_: `(2nd_Place_Count * 3) + (3rd_Place_Count * 1) - (1st_Place_Count * 2)`.
- **Heartbreakers**: Close calls.
  - _Logic_: Sum of "points missed by" in rounds where you finished 2nd.
- **No Glory**: Performing well without winning.
  - _Logic_: Total accumulated points in rounds where rank > 1.
- **Jinx**: Good score, bad rank.
  - _Logic_: Count of rounds where `Points > League_Avg` but `Rank > League_Median`.

### 4. Advanced Analysis

- **All-Play-All**: Virtual standings.
  - _Logic_: Recalculates the league table assuming every user played a H2H match against every other user every single round. (W=3, D=1, L=0).
- **Rivalry Matrix**: H2H record.
  - _Logic_: Head-to-Head record derived from comparing scores in every round.
- **Position Evolution**: Heatmap.
  - _Logic_: Your rank in the standings after every single round.
- **Efficiency**: ROI.
  - _Formula_: `Total_Points / Current_Squad_Value`. Measures points per million Euro spent.

## 💰 Money & Market (`/market`)

    Advanced financial analytics to help you win the transfer market.

    ### 1. Flipping & Trading

    - **Best Flip**: Top profits made from a single player (Buy Low -> Sell High).
    - **Worst Flip**: Biggest losses on a single player.
    - **Quick Flip**: Highest profit generated in the shortest ownership time (< 7 days).
    - **Top Trader**: Users with the highest volume of profitable trades.

    ### 2. Valuation & Growth

    - **Revaluation**: Current squad members who have increased (or decreased) most in value since purchase.
    - **Big Spender**: Tracks who spends the most money in the market.
    - **Profitable Player**: Players who have generated the most value (Points + Price Increase) for their owners.

    ### 3. Scouting & Opportunities

    - **Sniper Mode**: Highlights players currently on the market who are undervalued based on their recent performance.
    - **The Steal**: Players bought for cheap who exploded in value/points immediately after.
    - **Missed Opportunity**: Players you sold right before they started performing well.
    - **Market Trends**: Interactive charts showing market spending and player value history with customizable time ranges (1W, 1M, Season).

    ### 4. Ownership & Behavior

    - **The Thief**: Managers who frequently buy players that were previously owned by others.
    - **The Victim**: Managers who often sell players that immediately shine elsewhere.
    - **Longest Hold**: Players kept in a squad for the longest consecutive duration.

    ## 🏆 Tournaments & Cups

    Support for secondary competitions running alongside the main league.

    - **Custom Brackets**: Support for Playoffs, Final Four, and Group Phases.
    - **Cup Standings**: Separate points tracking for tournament rounds.
    - **Fixtures**: Head-to-Head matchups specific to tournament rules.

    ## 📅 Matches (`/matches`)

- **Live Scores**: Real-time updates matches in progress.
- **Round Selector**: Navigate through past and future rounds.
- **Daily Grouping**: Matches organized by date for easy planning.

## 📊 Predictions (`/predictions`)

- **Porras**: Track user predictions for match results.
- **Accuracy**: Who is the best at predicting Euroleague games?
- **Predictable Teams**: Which real teams are easiest/hardest to predict.
