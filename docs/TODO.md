# 📝 To-Do List

## High Priority
- [ ] **Data Integrity**: Integrate external API (Euroleague?) to fix corrupted `2-point attempts`.
    - The Biwenger API provides corrupted data for "2-Point Field Goals Attempted" (often returning negative values or `-1`).
    - Currently, we calculate `2PM` mathematically from Total Points, but we cannot recover `2PA` (Attempts), meaning we don't know the number of misses.
    - **Action**: Fetch match box scores from an external reliable source (Euroleague Official API or scraping) to merge with Biwenger data and display accurate shooting percentages.
- [ ] **Data Integrity**: Integrate external API (Euroleague?) to fix corrupted `2-point attempts`.
- [ ] **Advanced Analytics**: Implement "Squad Time Machine" - a method to reconstruct a user's squad at any specific timestamp using the transaction ledger.
- [ ] **UI Feature**: Visualize "Initial Squad Efficiency" (Actual vs Potential) using the logic stored in `src/lib/db/queries/analytics.js`.

## Backlog
- [ ] Review implementation of other ideas in [IDEAS.md](./IDEAS.md)
