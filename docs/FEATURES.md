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

## 📅 Matches (`/matches`)

- **Live Scores**: Real-time updates matches in progress.
- **Round Selector**: Navigate through past and future rounds.
- **Daily Grouping**: Matches organized by date for easy planning.

## 📊 Predictions (`/predictions`)

- **Porras**: Track user predictions for match results.
- **Accuracy**: Who is the best at predicting Euroleague games?
- **Predictable Teams**: Which real teams are easiest/hardest to predict.
