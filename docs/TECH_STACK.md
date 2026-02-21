# Technology Stack — Biwenger Stats

> A deep-dive into every technology choice, including version, purpose, and reasoning.

---

## Framework

### Next.js 16 — `next@^16.1.1`

**Role**: Full-stack framework (frontend routing, backend API, SSR, and build tooling)

Next.js 16 with the **App Router** is the core of this project. Key features used:

- **Server Components** — Pages (`page.js`) are React Server Components by default. They render on the server, reducing client bundle size and enabling direct data access without an intermediate API call.
- **Route Handlers** — The backend is entirely built as Next.js Route Handlers (`src/app/api/**/route.ts`), providing a clean co-located API without a separate Express server.
- **`proxy.js`** — Next.js 16's replacement for `middleware.js`. Used to enforce authentication on all non-API routes before requests reach the application.
- **Turbopack** — Used in development (`npm run dev --turbopack`) for significantly faster hot-module replacement compared to Webpack.
- **Image Optimization** — `next/image` component automatically optimises player and team imagery, including lazy loading and format conversion.

**Why Next.js over alternatives**: The co-location of frontend and backend in one deployable unit (Vercel-ready) was decisive. It eliminates the need for a separate API server, simplifies deployment, and keeps the architecture clean.

---

## Language

### TypeScript — `@types/node`, `@types/react`, `@types/pg`

**Role**: Type safety for the backend (API + services + database layer)

This project uses a **strategic partial migration** approach: TypeScript is used where it adds the most value (the data access, service, and API layers), while the React UI components remain in JavaScript. See [`docs/PATTERNS.md`](./PATTERNS.md) for the rationale.

TypeScript files:

- `src/lib/db/` — All database queries and the Drizzle schema
- `src/lib/services/` — All business logic services
- `src/lib/utils/` — Shared utilities (`response.ts`, `validation.ts`, `analytics.ts`, etc.)
- `src/app/api/**/route.ts` — All 56 API route handlers
- `src/lib/sync/` — The data synchronization pipeline

**Runner**: `tsx@^4.21.0` is used to execute TypeScript files directly (e.g., `npm run sync`) without a separate compile step.

---

## Database

### PostgreSQL + Drizzle ORM — `drizzle-orm@^0.45.1` · `drizzle-kit@^0.31.9`

**Role**: Primary data store + type-safe query builder

**PostgreSQL** is used as the relational database. It was chosen for:

- Strong support for complex analytical queries (window functions, CTEs, aggregations)
- JSON column support for flexible metadata storage
- Excellent indexing for the time-series query patterns (market value history, round-by-round stats)

**Drizzle ORM** is the query builder layer:

- Generates TypeScript types from the schema definition
- Provides a SQL-like API that stays close to raw SQL (no magic ORM abstractions)
- Schema migrations are managed via `drizzle-kit` (`drizzle.config.ts`)
- Configured for PostgreSQL with the `postgres` driver

**Drivers**:

- `pg@^8.16.3` — Primary PostgreSQL driver with connection pooling
- `postgres@^3.4.8` — Used by Drizzle for its native prepared statements

---

## Authentication

### Auth.js v5 — `next-auth@^5.0.0-beta.30`

**Role**: Session-based authentication and route protection

Auth.js (formerly NextAuth.js) v5 provides session management. The integration uses:

- **Credentials provider** — Password-based login (lightweight for a personal/league app)
- **`proxy.js`** — The Next.js 16 proxy file exports the Auth.js handler and protects all routes using a `matcher` pattern, blocking unauthenticated access to all non-API, non-login paths
- **`AUTH_SECRET`** — Session tokens are encrypted with an application-level secret

---

## Styling

### Tailwind CSS v4 — `tailwindcss@^4` · `@tailwindcss/postcss@^4`

**Role**: Utility-first CSS framework

Tailwind v4 is used throughout the UI with:

- CSS custom properties for the design token system (colors, spacing, radius)
- Dark mode support via class-based theme switching
- PostCSS integration (`postcss.config.mjs`)

### Supporting Libraries

| Library          | Version    | Purpose                                                                  |
| ---------------- | ---------- | ------------------------------------------------------------------------ |
| `clsx`           | `^2.1.1`   | Conditional class name merging                                           |
| `tailwind-merge` | `^3.4.0`   | Deduplication of conflicting Tailwind classes                            |
| `framer-motion`  | `^12.26.1` | Declarative animations — page transitions, card reveals, staggered lists |

The `cn()` utility in `src/lib/utils/index.ts` composes `clsx` and `tailwind-merge` into a single ergonomic helper used across all components.

---

## Data Visualisation

### Recharts — `recharts@^3.7.0`

**Role**: Primary charting library for composable, responsive charts

Used for: Market trends, points progression, squad value over time, distribution charts. Recharts was chosen for its React-native composable API (declarative `<LineChart><Line /></LineChart>` syntax) and built-in responsiveness.

### Chart.js + react-chartjs-2 — `chart.js@^4.5.1` · `react-chartjs-2@^5.3.1`

**Role**: Secondary charting (specific chart types not available in Recharts)

Used for: Radar charts and some advanced dataset visualisations.

---

## Icons & UI Primitives

| Library              | Version    | Purpose                                                      |
| -------------------- | ---------- | ------------------------------------------------------------ |
| `lucide-react`       | `^0.555.0` | Icon library — consistent, minimal SVG icons                 |
| `@heroicons/react`   | `^2.2.0`   | Supplementary icon set (Hero Icons by Tailwind Labs)         |
| `cmdk`               | `^1.1.1`   | Command palette (⌘K) component — powers the global search UI |
| `react-fast-marquee` | `^1.6.5`   | Scrolling news ticker in the news banner                     |

---

## Data Fetching & Validation

### Zod — `zod@^4.3.6`

**Role**: Runtime schema validation

Used for validating external API responses from Biwenger and Euroleague before data is persisted. This ensures that unexpected schema changes from external APIs surface as clear validation errors rather than silent data corruption.

### Custom Validators — `src/lib/utils/validation.ts`

Typed validation helpers (`validateNumber`, `validateUserId`, `validatePlayerId`, `validateRequiredString`) are called at every API route entry point. They return discriminated union types (`ValidationResult<T>`) making exhaustive error handling compile-time enforced.

---

## Data Synchronization

### Custom ETL Pipeline — `src/lib/sync/`

**Role**: Fetch, transform, and persist data from two external APIs

The sync system is a custom-built ETL (Extract, Transform, Load) pipeline with numbered steps run in sequence:

1. Players & Prices
2. User data
3. Market transfers
4. Round stats
5. Lineups
6. Match results
7. Euroleague boxscores

Execution modes:

- `npm run sync` — Full sync
- `npm run sync:daily` — Maintenance sync (incremental)
- `npm run sync:live` — Polling mode for live game updates

### GitHub Actions — `.github/workflows/`

**Role**: Scheduled data sync + CI/CD

Three workflows:
| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push / PR | Lint → Test → Build → Format Check |
| `sync.yml` | Daily cron | Runs `npm run sync:daily` |
| `sync-live.yml` | Manual / Game days | Runs `npm run sync:live` |

---

## Testing

### Vitest — `vitest@^4.0.14`

**Role**: Unit and integration testing

66 tests across 7 test suites:

- API response structure (success/error envelope)
- Validation utility edge cases
- Sync step logic (mock API responses)
- Service integration tests

Configuration: `vitest.config.ts` with `@/` path alias support.

---

## Developer Tooling

### Code Quality

| Tool                  | Version              | Role                             |
| --------------------- | -------------------- | -------------------------------- |
| `eslint@^9`           | `eslint-config-next` | Linting (Next.js ruleset)        |
| `prettier@^3.5.3`     | `.prettierrc`        | Code formatting                  |
| `husky@^9.1.7`        | `.husky/pre-commit`  | Git hooks                        |
| `lint-staged@^16.2.7` | `package.json`       | Run linters only on staged files |

### Build & Analysis

| Tool                    | Version   | Role                                            |
| ----------------------- | --------- | ----------------------------------------------- |
| `@next/bundle-analyzer` | `^16.1.1` | Visual treemap of JS bundle (`npm run analyze`) |
| `tsx`                   | `^4.21.0` | Zero-config TypeScript runner for scripts       |
| `dotenv`                | `^16.4.5` | Environment variable loading in scripts         |

---

## Infrastructure & Deployment

### Docker — `Dockerfile` · `docker-compose.yml`

The app ships with a complete Docker setup:

- `Dockerfile` — Multi-stage build for production (Node + Next.js)
- `docker-compose.yml` — Orchestrates the app + a PostgreSQL container for local development
- `.dockerignore` — Excludes `node_modules`, `.next`, `.env` from the image

### Deployment Target

Vercel (via Next.js native integration). Environment variables are configured directly in the Vercel dashboard. The `@vercel/analytics` package (`^1.6.1`) provides pageview and performance analytics.

---

## AI / Protocol Integration

### Model Context Protocol — `@modelcontextprotocol/sdk@^1.26.0`

A lightweight MCP server is exposed at `/api/mcp` (via the pages router), allowing AI assistants to introspect the application's API surface. This was used during development for AI-assisted debugging and is retained as a developer utility.

---

## External APIs

### Biwenger API (Private)

- **Auth**: Bearer token (`BIWENGER_TOKEN`)
- **Endpoints**: League data, market board, round scores, player prices

### Euroleague API (Public)

- **Role**: Deep basketball statistics (actual boxscores, assists, rebounds, etc.)
- **Integration**: Players are linked via a `player_mappings` table matching Euroleague IDs to Biwenger IDs

---

_For how these technologies work together, see [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) for the system design and [`docs/PATTERNS.md`](./PATTERNS.md) for the engineering patterns applied._
