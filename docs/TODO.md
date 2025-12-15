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
### Server-Side Dashboard Refactor (Performance & SEO)
Convert the Client-Side Dashboard (API-based fetching) to a Server Component architecture to improve initial load time and SEO.

- [ ] **1. Architecture Change: URL-Based User Selection**
    - Replace `UserContext` (localStorage) with URL routing.
    - Create dynamic route: `src/app/dashboard/user/[userId]/page.js`.
    - Redirect `/dashboard` middleware to default user ID if cookies exist, else prompt selection.

- [ ] **2. Parallel Data Fetching in Server Page**
    - Move data fetching logic from individual Cards (`MySeasonCard`, etc.) to `page.js`.
    - Execute parallel DB queries in `page.js` using `Promise.all()`:
        ```javascript
        const [userData, standings, market] = await Promise.all([
             getUserStats(userId),
             getStandings(),
             getMarketActivity()
        ]);
        ```
    - Remove `useEffect` and `fetch('/api/...')` from all dashboard cards.

- [ ] **3. Component "Dumbing Down"**
    - Refactor all Dashboard Cards to be "Pure UI Components".
    - They should receive `data` via Props and handle only rendering/interactivity.
    - Remove internal loading states (Server Page handles loading via `loading.js` Suspense).

- [ ] Review implementation of other ideas in [IDEAS.md](./IDEAS.md)
