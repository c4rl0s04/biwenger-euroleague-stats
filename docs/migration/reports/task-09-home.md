---
title: Task 09 Home
description: Home ownership, compatibility decisions and acceptance evidence.
audience:
  - maintainer
  - agent
status: active
---

# Task 09 — Home

Base: `5174e9a06f27f41a7bfa77051f8e2845fe1a2995`.
Branch: `refactor/home-feature-architecture`.
Worktree: `../biwengerstats-next-home-feature-architecture`.
Implementation in progress; not integrated or pushed. Task 10 has not started.

## Scope and flow

The existing `/` page, `/api/home/activity` and `/api/landing-stats` move behind Home contracts.
Desktop remains a client-side navigation landing with a browser-loaded hero; phone remains a
personal summary and league timeline, with independent Suspense sections. No redesign or new endpoint.

Before: page/global components → legacy Home/landing services → global queries and adapters.
After: page/HTTP adapters → Home services → Home timeline/season queries or deliberate
Standings/Rounds/Managers contracts → explicit serializable models → Home screens/components.

Home owns its unified seven-family activity projection. Splitting that SQL across independently
paginated features would alter ordering and cursor semantics. Existing Predictions normalization
continues through its deliberate server contract. The underlying SQL and highlight batching are
unchanged; Home does not duplicate other feature services or introduce provider operations.

The shared `getRequestStandings` service moves the existing request-local React cache into Standings.
AppShell's `getAppStandings` is an alias to the same function, and Home calls that service directly.
Both use the same mapped full-standings read as before. No shell composition migration or persistent
cache is introduced. Landing uses the separate mapped simple-standings service; summary and landing
consume Rounds' typed calendar directly instead of converting it to legacy Date-shaped rows.

## Contracts preserved

- Activity: session required at existing adapters, reject client `userId`, raw page response rather
  than a success wrapper, existing Spanish errors and 400/401/500 statuses, `force-dynamic`, exact
  `private, no-store`. Feed is league-wide, summary uses the trusted session user.
- Landing: public identity-independent aggregate, success envelope and 300/60 public cache policy;
  existing private/no-store errors. Reads stay sequential; current round only, configured season
  label and fixed playoff round 39 remain unchanged.
- Page: phone-only bonuses redirect, first repeated query values, unknown filter defaults and exact
  login callback remain. Desktop does not acquire a new page-level authentication call.
- Feed: seven event families, 15 raw rows plus lookahead, timestamp/ID cursor, six filters and bonuses
  alias, current date/number/null fallbacks, champion resolution, tied MVPs and ideal-lineup rules.
  Skipped insufficient-player highlights still advance the cursor from the original raw boundary.
- UI: per-filter component-memory snapshots, fetch no-store, abort/request ordering, item-ID
  deduplication, retry/infinite scroll, live-region copy, expanded cards and existing loading/errors.

## Ownership and retained code

`src/features/home` contains models, pure formatting, server-only queries/mappers/services,
cursor validation, client-safe public exports, server exports, phone server compositions and widgets.
Legacy Home service, Home query files, Home helper directory, old widget paths and unused Home/landing
service re-exports are removed. The final `news-landing-legacy.ts` implementation is retired.
The News boundary test now checks that removal. Existing unrelated Round adapters still have other
consumers and remain; global CSS, shared primitives and AppShell placement remain unchanged.

Architecture enforcement adds the three Home framework entrypoints. Only exact inherited auth
infrastructure edges are excepted, following the existing security gate; no Home query exemption
or checker relaxation is added.

## Baseline and acceptance

- Baseline `npm run verify`: PASS, 2,470 tests plus one existing skip, 24 existing lint warnings,
  production build, typecheck, architecture, documentation and offline schema/Drizzle checks.
- Original browser capture at unchanged base: 2/2 desktop/iPhone cases passed; repeat without
  updating references: 2/2 passed. Both images were inspected. Only relative activity times are
  masked; desktop News is suppressed with a synthetic empty response for Home capture stability.
- AST comparison: all 21 moved component bodies and both activity/highlight query implementations
  match the original after ignoring imports. Summary/landing differences only replace legacy
  calendar field adapters and separate dependency orchestration from mapping.
- Initial focused suite exposed Vite parsing a shared legacy JSX-in-JS card through the public
  barrel. The HTTP unit test mocks only the public model contract; no shared UI/configuration was
  changed. Updated focused suite: 105 tests passed before final additional coverage.
- First verifier stopped on the stale product-documentation `page.js` link; updated to `page.tsx`.

An intermediate full suite passed 2,499 tests but failed to start the worker for an unchanged
Standings calculation test. Its isolated retry passed without timeout or configuration changes.
The subsequent complete `npm run verify` passed: 2,505 tests plus one existing skip (305 passing
files), six packaged skills, architecture (1,002 modules / 86 protected entrypoints), 107 documentation
notes, typecheck, lint (zero errors / the same 24 warnings), production build, schema metadata
(37 tables / no drift), Drizzle and diff checks. Expected missing-provider notices remain.

Expanded focused Home/API/News-boundary/shared-Standings contracts passed 114 tests in 23 files.
Original activity mapper and feed-service bodies also match AST comparisons after dependency-name
substitution. An initial browser pass found two new-test mistakes: expecting ten ideal-lineup members
instead of the fixture's existing eight (three starters plus five bench), and an alert selector also
matching Next.js's route announcer. Only test expectations/selectors were corrected; no application,
fixture, error-guard or snapshot changes were used to address them.

Final combined rerun and browser acceptance completed cleanly: `npm run verify` passed all 2,505 tests across 306 files (plus 1 existing skip), TypeScript, lint, build and schema checks; `npm run test:e2e:local` passed 190 browser cases (17 intentional viewport skips, 0 failures), including all Home visual baseline comparisons and News regression checks without error-guard relaxation.

## Completion checklist

- [x] Original baseline and stable visual references.
- [x] Feature boundary and deliberate shared contracts.
- [x] Legacy consumers rewired and obsolete Home implementations removed.
- [x] Final focused/full checks and browser comparisons.
- [x] Logical local commits and clean worktree.

No production database, provider mutation, schema, dependency, authentication, credential,
environment or deployment configuration changes. Linux Home screenshot references and authenticated
real-production-data visual review remain separate checks. Next scope after acceptance: Task 10
Season Review data, not started here. Integration remains a separate approval.
