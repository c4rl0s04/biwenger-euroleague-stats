# Copilot Instructions — Biwenger Stats

Full-stack Euroleague fantasy analytics platform. Next.js 16 App Router + PostgreSQL + Drizzle ORM.

---

## Language Split

TypeScript is used exclusively for the backend; UI components are JavaScript. Never mix:

| TypeScript (`*.ts`)                     | JavaScript (`*.js`)                       |
| --------------------------------------- | ----------------------------------------- |
| `src/app/api/**/route.ts`               | `src/app/(app)/**/page.js`                |
| `src/lib/db/` (schema, queries, client) | `src/components/**`                       |
| `src/lib/services/`                     | `src/contexts/`                           |
| `src/lib/utils/`                        | `src/lib/hooks/`, `src/lib/api-client.js` |
| `src/lib/sync/`                         |                                           |

---

## 4-Layer Data Architecture

```
Browser
  → proxy.js          (Auth.js v5 guard — blocks unauthenticated non-API routes)
  → app/(app)/page.js (Server RSC — shell, metadata only, no direct DB calls)
  → *Client.js        (Client boundary — state, useApiData hook, animations)
  → /api/**/route.ts  (Thin handler — validate input, call ONE service, return)
  → lib/services/     (Business logic — parallel DB calls, data enrichment)
  → lib/db/queries/   (DAO layer — pure SQL via Drizzle, zero business logic)
  → PostgreSQL
```

API routes must be thin (~20 lines). Business logic belongs in `src/lib/services/`.
Database queries belong in `src/lib/db/queries/` — never inline in routes or services.

---

## File Naming Conventions

- `page.js` — Server RSC: metadata, auth shell, no interactivity
- `*Client.js` — Client component: data fetching, state, animations (e.g., `DashboardClient.js`)
- `*Card.js` — Client widget: receives data as props, self-contained display unit

---

## API Response Helpers

Always use helpers from `src/lib/utils/response.ts`:

```typescript
import {
  successResponse,
  errorResponse,
  cachedResponse,
  CACHE_DURATIONS,
} from '@/lib/utils/response';

// Success with cache
return successResponse(data, CACHE_DURATIONS.MEDIUM); // 5 min

// Error
return errorResponse('Not found', 404);
```

Cache constants: `SHORT` (1 min), `MEDIUM` (5 min), `LONG` (15 min).

---

## Database

- Singleton Drizzle client: `import { db } from '@/lib/db'`
- Schema definitions: `src/lib/db/schema.ts`
- All query functions live in `src/lib/db/queries/` organized by domain:
  - `queries/core/` — `users.ts`, `players.ts`, `teams.ts`
  - `queries/features/` — `market.ts`, `predictions.ts`, `search.ts`
  - `queries/competition/` — `rounds.ts`, `matches.ts`, `standings.ts`
  - `queries/analytics/` — `performance.ts`, `advanced_stats.ts`, `records.ts`
- Write operations (UPDATE/DELETE) live in `src/lib/db/mutations/` — same domain split (`users.ts`, `market.ts`, `players.ts`, etc.). Never put mutations in query files or vice versa.
- Drizzle schema migrations: `npx drizzle-kit generate` then `npx drizzle-kit migrate`

---

## Logic Layer

`src/lib/logic/` contains **pure calculation functions** that must stay consistent across both the database sync pipeline and the UI. These are framework-agnostic TypeScript functions with no DB or HTTP dependencies.

- `performance.ts` — `calculateStats()` for round efficiency, best/worst rounds (used in services and hooks)
- `standings.ts` — standings derivation formulas
- `match-scores.ts` — score calculation helpers

When a computation needs to produce the same result whether called from a service, a sync step, or a client hook — put it in `lib/logic/`, not in `lib/services/` or inline.

---

## ETL Sync Pipeline

Data is sourced from the Biwenger private API and the official Euroleague API.

```bash
npm run sync          # Full sync (14 sequential idempotent steps)
npm run sync:live     # Lightweight live-scores-only sync
```

Steps are in `src/lib/sync/steps/` (numbered `01-` to `14-`). Every step uses `INSERT ... ON CONFLICT DO UPDATE` — re-running is always safe.

Required env vars for sync: `BIWENGER_TOKEN`, `BIWENGER_LEAGUE_ID`, `BIWENGER_USER_ID`.

---

## MCP Server

The app exposes a **Model Context Protocol (MCP) server** for AI agents at `src/pages/api/mcp.js`. The server is built from three modules in `src/lib/mcp/`:

| File           | Role                       | Key exports                                                                             |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `resources.js` | Static context for the LLM | DB schema, scoring rules, glossary                                                      |
| `tools.js`     | Executable actions         | `search_players`, `get_player_details`, `get_market_opportunities`, `get_market_trends` |
| `prompts.js`   | SOPs / system prompts      | `analizar-jugador`, `analizar-mercado`                                                  |

The **Supabase MCP server** is the primary way to inspect and query the production database directly. Use it to explore schema, run ad-hoc queries, and verify data without SSH/psql access. The production DB is a Supabase PostgreSQL instance (connection string via `DATABASE_URL` env var).

---

## Client-Side Data Fetching

All Client Components fetch data through `src/lib/hooks/useApiData.js`. API calls on the client go through `src/lib/api-client.js` (`apiClient.get()` / `apiClient.post()`).

---

## Developer Workflows

```bash
npm run dev       # Dev server (Turbopack)
npm run build     # Production build
npm run test      # Vitest (alias @/ = src/)
npm run lint      # ESLint
npm run format    # Prettier over src/
npm run setup     # Interactive first-time setup wizard
```

Local database via Docker: `docker-compose up -d` (uses `POSTGRES_*` env vars from `.env`).

---

## Deployment

Production runs on **Vercel** (Next.js app) + **Supabase** (PostgreSQL). Docker/`docker-compose` is available for local development only.

- Set `DATABASE_URL` in Vercel env vars to point to the Supabase connection string — this takes precedence over individual `POSTGRES_*` vars.
- The sync pipeline (`npm run sync`) runs externally (e.g., GitHub Actions cron — see `.github/workflows/sync.yml`) and writes to the same Supabase DB.
- Local dev can use either Docker Postgres (`POSTGRES_*` vars) or point `DATABASE_URL` at Supabase directly.

---

## Agent Skills

Step-by-step workflows for the most common repetitive tasks live in `.agents/`:

| Skill                      | When to use                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `.agents/add-feature.md`   | New dashboard card end-to-end: query → service → route → component |
| `.agents/add-sync-step.md` | New ETL sync step + mutation in the pipeline                       |
| `.agents/add-db-query.md`  | New read query — includes domain→file mapping table                |

---

## Key Reference Files

| Purpose                       | File                                |
| ----------------------------- | ----------------------------------- |
| DB schema                     | `src/lib/db/schema.ts`              |
| All query exports             | `src/lib/db/index.ts`               |
| Market business logic example | `src/lib/services/marketService.ts` |
| Sync orchestrator             | `src/lib/sync/index.ts`             |
| Auth guard                    | `src/proxy.js`                      |
| Full architecture             | `docs/ARCHITECTURE.md`              |
| Design patterns               | `docs/PATTERNS.md`                  |
