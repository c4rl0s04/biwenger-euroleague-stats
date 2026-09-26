---
title: Task 19 — Hoopgrid Challenge & Gameplay Migration Receipt
description: Authoritative implementation receipt for Hoopgrid daily challenge generation, backtracking MRV solver, criteria catalog, cheatsheet isolation, and guess submission.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 19: Hoopgrid Challenge & Gameplay Migration Receipt

**Task status:** Implemented & Verified  
**Date:** 2026-09-27  
**Branch:** `refactor/hoopgrid`

---

## 1. Summary of Changes

Task 19 establishes the dedicated feature namespace `src/features/hoopgrid/`, encapsulating daily challenge generation, puzzle solving with backtracking MRV, criteria validation, cheatsheet data preparation, and guess submission:

1. **Feature Architecture:**
   - `src/features/hoopgrid/constants/hoopgrid-criteria.ts`: Criteria catalog with descriptive labels and helper utilities.
   - `src/features/hoopgrid/models/hoopgrid.models.ts`: Plain, typed, serializable view models (`HoopgridChallenge`, `HoopgridGuess`, `HoopgridTodayResponse`, `HoopgridCheatsheetData`, `HoopgridListResponse`, `HoopgridCriteriaCatalogViewModel`).
   - `src/features/hoopgrid/validation/hoopgrid.schema.ts`: Zod validation schemas (`SubmitGuessInputSchema`, `SubmitBatchGuessesInputSchema`, `HoopgridDateQuerySchema`) and typed `HoopgridValidationError`.
   - `src/features/hoopgrid/server/repositories/hoopgrid.repository.ts`: Encapsulated Drizzle ORM queries and mutations, resolving active season context internally and implementing concurrency-safe challenge creation via `onConflictDoNothing({ target: [hoopgridChallenges.gameDate] })`.
   - `src/features/hoopgrid/server/services/hoopgrid-command.service.ts`: Core game engines including cell complexity calculations, synchronous criteria validation, recursive backtracking solver with Minimum Remaining Values (MRV) heuristic, daily challenge generator, and guess/batch submission mutations.
   - `src/features/hoopgrid/server/services/hoopgrid-read.service.ts`: Safe read orchestration (`getTodayChallenge`, `listChallenges`, `getCheatsheetData`).
   - `src/features/hoopgrid/screens/`: Composed screens (`DesktopHoopgridScreen`, `MobileHoopgridScreen`, `HoopgridCheatsheetScreen`, `HoopgridCriteriaScreen`).
   - `src/features/hoopgrid/components/` & `src/features/hoopgrid/hooks/`: UI widgets and client game/share hooks relocated from legacy paths.
   - `src/features/hoopgrid/public.ts` & `src/features/hoopgrid/server.ts`: Client-safe barrel and server-only entrypoint protected with `import 'server-only'`.

2. **Routes & Pages Refactored:**
   - `src/app/(app)/hoopgrid/page.js`: Thin adapter rendering desktop and mobile screen adapters.
   - `src/app/hoopgrid-cheatsheet/page.js`: Session-protected server page calling `hoopgridReadService.getCheatsheetData`. Direct database and duplicate solver algorithms removed.
   - `src/app/test-hoopgrid/page.js`: Thin adapter rendering `HoopgridCriteriaScreen`.
   - `src/app/api/hoopgrid/today/route.ts`: Thin Route Handler consuming `hoopgridReadService.getTodayChallenge`.
   - `src/app/api/hoopgrid/guess/route.ts`: Session-protected Route Handler validating payload via Zod and calling `hoopgridCommandService.submitGuess` / `submitBatchGuesses`. Returns `private, no-store` headers.
   - `src/app/api/hoopgrid/list/route.ts`: Thin Route Handler consuming `hoopgridReadService.listChallenges`.

3. **Backwards-Compatible Adapters:**
   - `src/lib/services/features/hoopgridService.ts`: Re-exports command and read services from `@/features/hoopgrid/server`.
   - `src/lib/constants/hoopgridCriteria.ts`: Re-exports from `@/features/hoopgrid/public`.
   - `src/components/hoopgrid/*`: Re-exports from `@/features/hoopgrid/public`.
   - `src/hooks/hoopgrid/*`: Re-exports from `@/features/hoopgrid/public`.
   - `src/components/mobile/screens/MobileHoopgridScreen.tsx`: Re-exports from `@/features/hoopgrid/public`.

4. **Architecture Policy:**
   - Registered 6 hoopgrid entrypoints (`hoopgrid-gameplay`, `hoopgrid-cheatsheet`, `hoopgrid-criteria-test`, `api-hoopgrid-today`, `api-hoopgrid-guess`, `api-hoopgrid-list`) and explicit `auth()` exception declarations in `scripts/architecture/policy.json`.

---

## 2. Architectural Boundaries & Security Guarantees

- **Answer Privacy & Leak Prevention:** Public gameplay routes (`/hoopgrid`, `GET /api/hoopgrid/today`, `POST /api/hoopgrid/guess`, `GET /api/hoopgrid/list`) never return valid player lists or precomputed solution sets.
- **Cheatsheet Protection:** The `/hoopgrid-cheatsheet` route is protected by `auth()`, requiring an active authenticated user session before returning cheatsheet matrices and valid player counts.
- **Safe Lazy Challenge Generation:** Concurrency race conditions in `GET /api/hoopgrid/today` are resolved via idempotent DB insertion (`onConflictDoNothing`). If two concurrent requests generate a challenge for the same date, only one is persisted, and the winning record is reloaded cleanly.
- **Fail-Closed Guess Mutation:** Guess submission enforces authenticated user ID binding from `auth()`, rejects unauthenticated callers with HTTP 401, validates payloads against Zod schemas, and returns `Cache-Control: private, no-store`.
- **Layer Isolation:** Direct Drizzle queries and DB imports are encapsulated in `hoopgridRepository.ts`. Presentation components and Route Handlers receive only serializable view models.

---

## 3. Verification Evidence

- **Unit Tests:**
  - `src/features/hoopgrid/__tests__/hoopgrid.schema.test.ts`: 11 passed.
  - `src/features/hoopgrid/__tests__/hoopgrid-command.service.test.ts`: 15 passed.
  - `src/features/hoopgrid/__tests__/hoopgrid-read.service.test.ts`: 6 passed.
  - `src/app/api/hoopgrid/__tests__/hoopgrid.test.ts`: 4 passed.
- **Architecture Integrity:** `npm run architecture:check` passed with 0 violations across 94 entrypoints and 1,083 modules.
- **Type Safety:** `npm run typecheck` passed with 0 errors.
- **Lint:** `npm run lint` passed with 0 errors (legacy img warnings only).
- **Documentation Vault:** `npm run docs:check` passed across 119 notes.
- **Database Schema & Drift Audits:** `npx drizzle-kit check` and `npm run db:audit:schema:metadata` passed (37 tables, 0 drift).
- **Production Build:** `npm run build` compiled successfully (52/52 static pages generated).
- **Full Test Suite:** `npm run test:run -- --maxWorkers=2` passed (333 test files, 2,755 tests passed, 0 failures, 2 skipped).
