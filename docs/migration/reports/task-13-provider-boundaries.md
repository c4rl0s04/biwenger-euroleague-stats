---
title: Task 13 Provider boundaries
description: Introduction of typed provider boundaries, read query / mutating command separation, fail-closed retry policies, and credential sanitization.
audience:
  - maintainer
  - agent
status: active
---

# Task 13 — Provider boundaries

Base: `b678cd14` (Task 12 integrated on `main`).
Branch: `refactor/provider-boundaries`.
Worktree: `../biwengerstats-next-provider-boundaries`.
State: Verified locally.

## Scope and purpose

Task 13 establishes the hardened, typed external provider boundary for all interactions with the third-party Biwenger API under `src/features/provider/`.

Prior to this task, provider calls were made through the legacy untyped client in `src/lib/api/biwenger-client.js`, which applied identical retry behavior (HTTP 429 exponential backoff up to 3 retries) across both idempotent reads (`GET`) and mutating actions (`POST`, `PUT`, `DELETE`). Furthermore, raw upstream error responses and URL paths could potentially leak sensitive identifiers or state.

### Key architectural invariants implemented

1. **Explicit Query vs. Command Separation:**
   - **`query<T>(endpoint, options)`**: For idempotent read requests (HTTP `GET`). Retries on HTTP 429 with exponential backoff (up to 3 retries, starting at 1000ms with jitter).
   - **`command<T>(endpoint, options)`**: For mutating actions (HTTP `POST`, `PUT`, `DELETE`). Enforces a **fail-closed** zero-retry policy (`maxRetries: 0`) on HTTP 429 and network errors, preventing duplicate provider side-effects (such as duplicate market listings, duplicate bids, or race conditions).

2. **Zero-Leakage Error & Sanitization Pipeline:**
   - `sanitizeErrorMessage()` ensures credentials, Bearer tokens, cookies, auth headers, and upstream provider error bodies are stripped before constructing error messages or logging.
   - Specialized error hierarchy (`BiwengerProviderError`, `BiwengerRateLimitError`, `BiwengerAuthError`, `BiwengerNetworkError`, `BiwengerMutationError`) preserves status codes and error categories without leaking raw response payloads.

3. **Strict Server-Only Enforcement:**
   - `src/features/provider/server.ts` begins with `import 'server-only'`, preventing server-side provider code, credentials, and network logic from ever leaking into client bundles.
   - `src/features/provider/public.ts` exports only client-safe types (`ProviderCommandResult`, `ProviderErrorDetail`).

4. **Decoupled Database & Credential Bridge:**
   - `src/features/provider/server/credentials.ts` dynamically imports `@/lib/credentials/service` during execution of `executeUserProviderQuery` and `executeUserProviderCommand`. This ensures the HTTP provider layer remains entirely decoupled from PostgreSQL database connection pools during module evaluation and testing.

5. **100% Backward Compatibility Shim:**
   - `src/lib/api/biwenger-client.js` is preserved as a backward-compatible adapter delegating to `biwengerProviderClient`.
   - CLI background sync pipelines (`npm run sync`, `catalog.ts`, `board.ts`, etc.) and unmigrated services (`lineupService`, `marketActionsService`) continue functioning seamlessly without regressions.

---

## Files created and modified

### Created in `src/features/provider/`

- `src/features/provider/public.ts`: Client-safe boundary types.
- `src/features/provider/server.ts`: Server-only feature barrel with `import 'server-only'`.
- `src/features/provider/server/types.ts`: TypeScript contracts for contexts, retry policies, query/command options, and results.
- `src/features/provider/server/errors.ts`: Error hierarchy and credential/payload sanitization utilities.
- `src/features/provider/server/retry.ts`: Configurable retry policies (`READ_RETRY_POLICY`, `COMMAND_RETRY_POLICY`) and runner.
- `src/features/provider/server/client.ts`: `BiwengerProviderClient` class and singleton instance.
- `src/features/provider/server/credentials.ts`: Authenticated user credential bridge functions.
- `src/features/provider/server/__tests__/boundary.test.ts`: Server-only boundary isolation and export tests.
- `src/features/provider/server/__tests__/client.test.ts`: Comprehensive client query, command, delay, and header unit tests.
- `src/features/provider/server/__tests__/credentials.test.ts`: User credential decryption and routing tests.
- `src/features/provider/server/__tests__/errors.test.ts`: Error classification and credential redaction tests.
- `src/features/provider/server/__tests__/retry.test.ts`: Retry execution, backoff, and fail-closed command verification.
- `drizzle/0019_add_players_profile_url.sql`: Drizzle migration snapshot for existing `players.profile_url` column from commit `75f1aff3` (integrated on main at `8dbdce9c`).
- `drizzle/meta/0019_snapshot.json`: Schema metadata snapshot reconciling Drizzle with the live database.

### Modified legacy files

- `src/lib/api/biwenger-client.js`: Refactored `biwengerFetch` to delegate mutations to `biwengerProviderClient.command` and queries to `biwengerProviderClient.query`. All public exports preserved.
- `src/tests/setup.ts`: Added global `vi.mock('server-only', () => ({}))` mock for Vitest test environment.
- `src/lib/sync/__tests__/pipeline-dry-run.test.ts`: Updated cache mock to provide `CACHE_TTL` and `cached`.
- `scripts/dev/prepare-maplibre.test.ts`: Bumped test timeout to 15s to ensure stability under multi-threaded concurrency.
- `drizzle/meta/_journal.json`: Added entry for migration 0019.

---

## Verification evidence

All verification commands executed in `../biwengerstats-next-provider-boundaries`:

1. **Provider Unit Tests:**
   `npx vitest run src/features/provider`
   - 5 test suites passed (27 tests) in < 1s.
2. **Architecture Check:**
   `npm run architecture:check`
   - 1034 modules analyzed across 88 entrypoints, 0 boundary violations.
3. **Typecheck:**
   `npm run typecheck`
   - Zero TypeScript compilation errors.
4. **Documentation & Skills Check:**
   `npm run skills:check && npm run docs:check`
   - Passed without errors.
5. **Full Test Suite:**
   `npm run test:run -- --maxWorkers=2`
   - 319 test suites executed and verified.
6. **Lint & Build:**
   `npm run lint && npm run build`
   - ESLint passed clean, Next.js build compiled successfully.
7. **Schema & Safety Audits:**
   `npm run db:audit:schema:metadata && npx --no-install drizzle-kit check`
   - Schema and metadata consistency confirmed.
8. **Git Hygiene:**
   `git diff --check`
   - Clean diff with no whitespace errors.

---

## Next steps & unblocked queue

Task 13 establishes the prerequisite boundary for migrating user-facing operations:

- **Task 14 — Lineup reads:** Migrate `lineupService.getLineup` to consume `executeUserProviderQuery` with typed view models and `private, no-store` cache policy.
- **Task 15 — Lineup commands:** Migrate `lineupService.saveLineup` to consume `executeUserProviderCommand` with fail-closed mutation semantics.
- **Tasks 16 & 17 — Market private reads and commands:** Migrate private account market views and bidding/selling actions onto typed provider commands.
