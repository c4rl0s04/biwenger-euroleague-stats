# 📝 To-Do List

## High Priority
- [ ] **Integrate External Stats Source (Euroleague API / Sofascore)**: 
    - The Biwenger API provides corrupted data for "2-Point Field Goals Attempted" (often returning negative values or `-1`).
    - Currently, we calculate `2PM` mathematically from Total Points, but we cannot recover `2PA` (Attempts), meaning we don't know the number of misses.
    - **Action**: Fetch match box scores from an external reliable source (Euroleague Official API or scraping) to merge with Biwenger data and display accurate shooting percentages.

## Backlog
- [ ] Review implementation of other ideas in [IDEAS.md](./IDEAS.md)
