# Biwenger Stats - Technical Architecture

> **Comprehensive guide to the technical design, patterns, and structure of the application.**

---

## 1. Directory Structure

The project follows a modular, feature-based structure using Next.js 16 (App Router).

```
src/
├── app/                  # Next.js App Router (Routing & Pages)
│   ├── api/              # Backend API Endpoints (Route Handlers)
│   ├── dashboard/        # Dashboard Page Module
│   ├── standings/        # Standings Page Module
│   ├── schedule/         # Schedule Page Module
│   ├── matches/          # Matches Page Module
│   ├── player/[id]/      # Dynamic Player Profile
│   └── globals.css       # Global Styles & Tailwind Directives
│
├── components/           # React Components
│   ├── dashboard/        # Dashboard-specific cards/widgets
│   ├── standings/        # Standings-specific analysis cards
│   ├── matches/          # Match cards and round selectors
│   ├── ui/               # Reusable UI (Buttons, Cards, Inputs)
│   └── layout/           # Layout components (Navbar, Shell)
│
└── lib/                  # Core Business Logic & Utilities
    ├── db/               # Database Access Layer
    │   ├── client.js     # Singleton DB connection
    │   └── queries/      # SQL queries organized by domain (users.js, stats.js)
    ├── sync/             # Data Synchronization System
    │   ├── manager.js    # Orchestrator for sync jobs
    │   └── steps/        # Individual sync steps (01-players, 02-lineups...)
    ├── hooks/            # Custom React Hooks (useApiData, etc.)
    ├── services/         # Shared business logic
    └── utils/            # Helpers (formatters, calculations)
```

---

## 2. Technology Stack

### Frontend

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: JavaScript (ES6+ with JSDoc typing)
- **Styling**: Tailwind CSS v4 + `clsx` + `tailwind-merge`
- **Animation**: `framer-motion`
- **Charts**: `recharts` & `chart.js`
- **Icons**: `lucide-react`
- **State**: React Query-like custom hook (`useApiData`)

### Backend / Data

- **Runtime**: Node.js
- **Database**: PostgreSQL (via `pg`)
- **Validation**: `zod`
- **Testing**: `vitest`

### Data Synchronization

- **Scheduler**: GitHub Actions (Daily updates) + manual trigger
- **Environment**: `dotenv` for configuration

---

## 3. Database Architecture

We use **PostgreSQL** for detailed relational data.

### Connection Strategy

- **Singleton Pattern**: The database connection is established once in `src/lib/db/client.js` and reused.
- **Connection Pooling**: Handled by `pg` pool to manage connections efficiently in a serverless/container environment.
- **Query Organization**: Queries are NOT written inline in components. They are organized in `src/lib/db/queries/*.js` to promote reuse and separation of concerns.

### Key Tables

| Domain     | Table                | Description                               |
| ---------- | -------------------- | ----------------------------------------- |
| **Core**   | `users`              | League participants (Biwenger IDs)        |
| **Core**   | `players`            | Official player registry with prices      |
| **Stats**  | `player_round_stats` | Boxscores for every player in every game  |
| **Stats**  | `user_rounds`        | The points each user scored in each round |
| **Market** | `market_values`      | Daily price snapshots for analytics       |
| **Logic**  | `lineups`            | Who started whom (and captains) per round |

---

## 3.5 Service Layer Pattern

To avoid bloated API handlers and duplicated logic, we use a dedicated **Service Layer** (`src/lib/services/`).

- **Architecture Flow**: `API Route` -> `Service` -> `DAO (Data Access Object)` -> `Database`.
- **Responsibility**: Services handle business rules, data aggregation, and transformation.
- **Example**: `marketService.js` executes 20+ parallel queries (Best Flip, Big Spender, etc.) and enriches the results with user metadata before returning a unified object to the frontend.

---

## 4. Internal API

The application exposes a read-only API for the frontend, located in `src/app/api/`.

### Response Format

All endpoints return a standard JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Core Endpoints

- `GET /api/users`: List all league users
- `GET /api/players`: List all players with current stats
- `GET /api/teams`: List Euroleague teams
- `GET /api/rounds`: List season rounds

### Feature Endpoints

- `GET /api/dashboard/summary`: KPIs for the user dashboard
- `GET /api/standings`: Full league standings with extended stats
- `GET /api/market/activity`: Recent transfers and bids
- `GET /api/predictions`: User prediction stats

---

## 5. Data Synchronization System

The application relies on a sync pipeline to mirror data from Biwenger and Euroleague APIs.

> 📘 **See [DATA_SYNC.md](./DATA_SYNC.md) for the full guide on how to run and debug the sync process.**

The sync logic resides in `src/lib/sync/` and is designed to be idempotent. It handles:

- Updating player rosters and prices
- Fetching match results and live scores
- Processing the transfer market feed
- Calculating fantasy points and user standings

---

## 6. Frontend Architecture

### Server vs Client Components

- **Page Layouts (`page.js`)**: Server Components. They serve the initial shell and SEO metadata.
- **Client Wrappers**: Most dynamic dashboards use a `*Client.js` wrapper (e.g., `StandingsClient.js`) to handle interactivity and data fetching.
- **Cards**: The UI is composed of "Cards" (e.g., `VolatilityCard`, `TeamValueCard`). Each card is responsible for rendering a specific metric.

### Data Fetching Hook: `useApiData`

We avoid `useEffect` fetch boilerplate by using a custom hook: `src/lib/hooks/useApiData.js`.

- **Automatic Loading/Error States**: Simplifies UI logic.
- **Dependency Tracking**: Refetches automatically when props (like `roundId`) change.
- **Standardized Response**: Expects `{ success: true, data: ... }` from our internal API.

```javascript
// Example Usage
const { data, loading } = useApiData(`/api/rounds/standings?round=${roundId}`, {
  dependencies: [roundId],
  immediate: true,
});
```

### Theme System

- Colors are centralization in `src/lib/utils/colors.js`.
- Users have assigned "Identity Colors" based on their avatar/preference, which tint their dashboard UI.

---

## 7. External APIs

### 1. Biwenger API (Private)

- **Role**: The source of truth for Fantasy Football/Basketball data.
- **Auth**: Bearer Token (`BIWENGER_TOKEN`).
- **Endpoints Used**:
  - `/league/{id}/board`: Transfer market & news feed.
  - `/competitions/euroleague/data`: Master data.
  - `/rounds/euroleague/{id}`: Match results and scores.

### 2. Euroleague API (Public/Private)

- **Role**: Providing deep basketball statistics (beyond just fantasy points).
- **Integration**: Mapped via `player_mappings` table to link specific Euroleague Player IDs to Biwenger IDs.

---

## 8. Performance & Optimization

- **Bundle Analysis**: `npm run analyze` creates a visual treemap of the build.
- **Image Optimization**: All player/team images use `next/image` with remote patterns configured in `next.config.mjs`.
- **Database Indexing**: Critical columns (`player_id`, `round_id`, `date`) are indexed in Postgres for faster joins.
- **Caching**: Heavy analytical queries (like "All-Play-All" standings) are cached at the database or API level where appropriate.
