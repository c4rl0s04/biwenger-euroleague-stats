---
title: Task 14 Lineup reads
description: Domain feature boundary for private lineup reads, typed safe models, no-store provider query orchestration, and backward-compatible service adapters.
audience:
  - maintainer
  - agent
status: active
---

# Task 14 — Lineup reads

Base: `89aa730e` (`main`).
Branch: `refactor/lineup-reads`.
Worktree: `../biwengerstats-next-lineup-reads`.
State: Integrated into main at `b40d9256`.

## Scope and purpose

Task 14 migrates the live fantasy lineup read operations from legacy global layers into the dedicated domain feature `src/features/lineup/`.

Prior to this task, user squad and lineup reads were orchestrated through `src/lib/services/lineupService.ts` and `src/lib/services/lineupResponse.ts`. While the response mapper previously stripped tokens, it was an unclassified global service mixed with raw mutation methods.

### Key architectural invariants implemented

1. **Feature Domain Boundary (`src/features/lineup/`)**:
   - `src/features/lineup/server.ts`: Marked with `import 'server-only'`, exposing `lineupReadService`, `mapToSafeLineupResponse`, and `LINEUP_READ_FIELDS`.
   - `src/features/lineup/public.ts`: Exports only client-safe view model types (`SafeLineupResponse`, `SafeLineupConfig`, `SafeLineupPlayer`, `SafeMarketListing`, `SafeLineupOffer`).
   - `src/features/lineup/models/lineup.ts`: TypeScript contracts for the sanitized view model and raw provider shapes.

2. **Provider Boundary Integration**:
   - `lineupReadService.getLineup(userId)` routes through `executeUserProviderQuery` in `@/features/provider/server`, ensuring that actor credentials decrypted by the keyring are securely passed in the request context and never exposed.
   - Enforces `cache: 'no-store'` freshness policy and private cache semantics for personal squad data.

3. **Sanitization & Redaction Pipeline**:
   - `mapToSafeLineupResponse` extracts only essential identifiers and public listing data, discarding Bearer tokens, cookies, auth headers, email addresses, and extraneous upstream fields.
   - Verified with canary token test suites to guarantee zero secret leakage.

4. **Lineup Command Freeze & Schedule Preservation**:
   - `src/features/schedule/boundary.test.ts` asserts that `src/app/api/users/lineup/route.ts` remains frozen until Task 15 (Lineup commands).
   - In Task 14, `src/app/api/users/lineup/route.ts` remains completely untouched, preserving its SHA-256 hash.
   - `src/lib/services/lineupService.ts` and `src/lib/services/lineupResponse.ts` are retained as backward-compatible adapters. `lineupResponse.ts` delegates to `@/features/lineup/server`, and `lineupService.getLineup` preserves legacy client compatibility.

5. **Manager Squad Contract Independence**:
   - The database-backed manager squad contract (`getManagerSquadData` in `@/features/managers/server` called by `/api/player/squad`) remains completely independent and unmodified.

---

## Files created and modified

### Created in `src/features/lineup/`

- `src/features/lineup/public.ts`: Client-safe view model types and interfaces.
- `src/features/lineup/server.ts`: Server-only feature barrel with `import 'server-only'`.
- `src/features/lineup/models/lineup.ts`: Domain models for sanitized lineup contracts.
- `src/features/lineup/server/mappers/lineup-read.mapper.ts`: Sanitizing mapper producing `SafeLineupResponse`.
- `src/features/lineup/server/services/lineup-read.service.ts`: Feature service querying Biwenger via `executeUserProviderQuery`.
- `src/features/lineup/server/__tests__/boundary.test.ts`: Boundary tests verifying `server-only` isolation and public type safety.
- `src/features/lineup/server/__tests__/lineup-read.mapper.test.ts`: Comprehensive mapper test suite with canary token redaction checks.
- `src/features/lineup/server/__tests__/lineup-read.service.test.ts`: Service unit tests verifying context binding, options, and error propagation.

### Modified files

- `src/features/provider/server/types.ts`: Added optional `context` to `BiwengerQueryOptions` and `BiwengerCommandOptions`.
- `src/features/provider/server/client.ts`: Supported passing `context` via options in `query()` and `command()`.
- `src/lib/services/lineupResponse.ts`: Re-exports `mapToSafeLineupResponse` from `@/features/lineup/server`.
- `src/lib/services/lineupService.ts`: Preserved as backward-compatible adapter.
- `docs/migration/tracker.md`: Marked Task 14 as verified locally.

---

## Verification evidence

All verification commands executed in `../biwengerstats-next-lineup-reads`:

1. **Lineup Unit Tests:**
   `npx vitest run src/features/lineup`
   - 3 test suites passed (9 tests) in 320ms.
2. **Legacy Lineup & Route Tests:**
   `npx vitest run src/lib/services/lineupResponse.test.ts src/lib/services/credential-boundary.test.ts src/app/api/user/__tests__/user-routes.test.ts`
   - 3 test suites passed (10 tests).
3. **Schedule Boundary Freeze Test:**
   `npx vitest run src/features/schedule/boundary.test.ts`
   - Verified that `src/app/api/users/lineup/route.ts` matches the expected SHA-256 hash (frozen until Task 15).
4. **Architecture Check:**
   `npm run architecture:check`
   - 1039 modules analyzed across 88 entrypoints, 0 violations.
5. **Typecheck:**
   `npm run typecheck`
   - Zero TypeScript compilation errors.
6. **Documentation & Skills Check:**
   `npm run skills:check && npm run docs:check`
   - Passed without errors.
7. **Full Test Suite & Production Build:**
   `npm run verify`
   - Executed and passed across the entire repository.

---

## Next steps & unblocked queue

Task 14 completes the private read foundation, directly unblocking:

- **Task 15 — Lineup commands:** Migrate `lineupService.updateLineup`, `POST /api/users/lineup`, and schedule auto-alignment submissions to consume `executeUserProviderCommand` with fail-closed mutation semantics and explicit reconciliation.
