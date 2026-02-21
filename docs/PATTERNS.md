# Design Patterns & Engineering Methodologies

> A catalogue of the software engineering patterns and architectural decisions applied in this project.

---

## 1. Repository / DAO Pattern

**Where**: `src/lib/db/queries/`

Database access logic is **never written inline** in components or API routes. All SQL is isolated in dedicated query files organized by domain:

```
src/lib/db/queries/
├── core/
│   ├── users.ts
│   └── players.ts
├── features/
│   ├── market.ts
│   ├── standings.ts
│   ├── rounds.ts
│   └── ...
└── index.ts    ← barrel export
```

Each file is a **Data Access Object (DAO)** — a pure module responsible only for communicating with the database. It has no business logic, no HTTP concerns, and no side effects beyond the query itself.

**Benefit**: Queries are testable in isolation, reusable across multiple services, and easy to optimise without touching any business logic.

---

## 2. Service Layer Pattern

**Where**: `src/lib/services/`

Between the API routes and the database sits a **Service Layer** that owns all business logic.

```
API Route (route.ts)
    ↓
Service (marketService.ts)
    ↓
DAO (queries/features/market.ts)
    ↓
Database (PostgreSQL)
```

An API route handler is deliberately thin — it validates input, calls exactly one service function, and returns the result. It contains zero business logic.

**Example**: `marketService.ts` executes 20+ parallel database queries (best flip, worst flip, biggest spender, biggest profit, etc.), enriches each result with user metadata, and returns a single unified object. The API route at `/api/market/route.ts` is only ~20 lines.

**Benefit**: Prevents "fat controllers". Business logic is co-located, reusable across routes, and independently testable.

---

## 3. ETL Pipeline Pattern

**Where**: `src/lib/sync/`

Data synchronisation follows a classic **Extract → Transform → Load** pipeline with explicit numbered steps:

```
src/lib/sync/
├── index.ts          ← Orchestrator (runs steps in order)
├── live.ts           ← Live-mode polling entry point
└── steps/
    ├── 01-players.ts
    ├── 02-users.ts
    ├── 03-market.ts
    ├── 04-rounds.ts
    ├── 05-lineups.ts
    ├── 06-matches.ts
    └── 07-euroleague.ts
```

Key properties:

- **Idempotent** — Every step uses `INSERT ... ON CONFLICT DO UPDATE`, so re-running the sync never produces duplicate data
- **Ordered** — Steps are sequentially numbered because later steps depend on earlier ones (e.g., lineups require players and rounds to exist)
- **Isolated** — Each step can be run independently for debugging
- **Resumable** — Failures in step N don't corrupt steps 1–N-1

---

## 4. Singleton Pattern

**Where**: `src/lib/db/index.ts`

The database connection is instantiated once and exported as a module-level singleton:

```typescript
// Created once, reused across the entire application lifetime
const db = drizzle(pool, { schema });
export { db };
```

In a Next.js serverless/edge environment, module-level singletons persist across requests within the same worker instance. This prevents connection pool exhaustion that would occur if a new pool were created per request.

---

## 5. Server / Client Component Split

**Where**: `src/app/(app)/*/page.js` (Server) · `src/components/**/*Client.js` (Client)

Next.js App Router introduces a hard boundary between Server and Client Components. This project follows a consistent pattern:

| File Type    | Rendering | Responsibilities                                      |
| ------------ | --------- | ----------------------------------------------------- |
| `page.js`    | Server    | Metadata, auth check, initial shell, SEO              |
| `*Client.js` | Client    | Interactivity, state, data fetching hooks, animations |
| `*Card.js`   | Client    | Individual data widget, receives data as props        |

**Example flow**:

```
dashboard/page.js (Server RSC)
    └── DashboardClient.js (Client boundary)
            ├── CaptainStatsCard.js
            ├── HomeAwayCard.js
            └── IdealLineupCard.js (each fetches its own data via useApiData)
```

This minimises JavaScript sent to the browser (server components ship no JS) while keeping the interactive layer ergonomic.

---

## 6. Custom Hook Pattern — `useApiData`

**Where**: `src/lib/hooks/useApiData.js`

All client-side data fetching is abstracted into a single reusable hook rather than scattered `useEffect` calls:

```javascript
const { data, loading, error } = useApiData('/api/rounds/stats', {
  dependencies: [roundId, userId],
  immediate: true,
});
```

The hook provides:

- Automatic loading and error state management
- Dependency-based refetching (like `useEffect` deps)
- Standardised response unpacking (expects `{ success, data }` envelope)
- Request cancellation on unmount

**Benefit**: Eliminates ~30 lines of boilerplate per component and enforces a single data-fetching contract across the entire UI layer.

---

## 7. Standardised API Response Envelope

**Where**: `src/lib/utils/response.ts` · all 56 API routes

Every API endpoint returns the same JSON structure:

```json
{
  "success": true,
  "data": { ... }
}
```

or on error:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

The `successResponse()` and `errorResponse()` utilities in `response.ts` enforce this shape type-safely. The `useApiData` hook on the frontend expects this exact contract, creating a reliable communication protocol between the two layers.

**Benefit**: The frontend never needs to handle inconsistent response shapes. Error handling is uniform. Adding a new endpoint automatically works with the existing hook.

---

## 8. Validation at the API Boundary

**Where**: `src/lib/utils/validation.ts` · every `route.ts` file

All user-controlled input is validated at the API entry point, before it reaches any service or database query. Type-safe validator functions return a discriminated union:

```typescript
type ValidationResult<T> = { valid: true; value: T } | { valid: false; error: string };
```

Usage in a route:

```typescript
const userIdValidation = validateUserId(searchParams.get('userId'));
if (!userIdValidation.valid) {
  return errorResponse(userIdValidation.error, 400); // TypeScript knows .error exists here
}
// TypeScript knows .value is the validated type here
const data = await fetchData(userIdValidation.value);
```

**Benefit**: TypeScript's discriminated union forces exhaustive handling of both branches at compile time. Invalid IDs can never reach the database layer.

---

## 9. Proxy / Auth Guard Pattern

**Where**: `src/proxy.js`

Authentication is enforced at the proxy layer, not inside individual route handlers. The `proxy.js` file intercepts every request and redirects unauthenticated users to `/login` before the request reaches any page component.

```javascript
// proxy.js — runs before any route handler
export default auth; // Auth.js handler

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
```

The `matcher` explicitly excludes API routes, static assets, and the login page from the auth check — everything else is protected by default.

**Benefit**: Auth is centralised. Adding a new page automatically gets protected without any per-page auth code. API routes handle their own auth separately via session checks.

---

## 10. Incremental TypeScript Adoption

**Methodology**: Strategic partial migration

Rather than converting the entire codebase at once (expensive, high churn) or staying fully in JavaScript (no type safety), this project uses a **boundary-first TypeScript strategy**:

| Layer            | Language   | Rationale                                                                          |
| ---------------- | ---------- | ---------------------------------------------------------------------------------- |
| Database queries | TypeScript | Catches schema mismatches, column name typos, wrong types before runtime           |
| Services         | TypeScript | Documents function contracts, catches data transformation errors                   |
| API routes       | TypeScript | Validates request/response shapes at compile time                                  |
| UI components    | JavaScript | Display logic; errors are visible immediately; 242 files = high churn for low gain |

This approach delivers ~80% of TypeScript's error-catching value (the backend) at ~20% of the full migration cost.

Type safety "stops at the API boundary" — the UI talks to the API over HTTP (not direct function calls), so typed API routes give confidence that the contract is correct even though the consuming component is JavaScript.

---

## 11. Barrel Export Pattern

**Where**: `src/lib/services/index.ts` · `src/lib/db/queries/index.ts` · `src/components/*/index.js`

Related modules are re-exported from a single `index.ts` file:

```typescript
// src/lib/services/index.ts
export { fetchCaptainStats } from './dashboardService';
export { getMarketPageData } from './marketService';
export { getAllPlayers } from './playerService';
// ...
```

This means API routes import from `@/lib/services` (one path) rather than needing to know which specific service file each function lives in. Refactoring the internal file structure never breaks import paths.

---

_For the technologies underlying these patterns, see [`docs/TECH_STACK.md`](./TECH_STACK.md). For the system architecture, see [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)._
