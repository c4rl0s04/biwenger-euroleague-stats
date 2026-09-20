---
title: Task 04 — Schedule read migration
description: Scope, compatibility decisions and local acceptance evidence for Schedule.
audience:
  - maintainer
  - agent
status: active
---

# Schedule read migration

Release follow-up: Tasks 01–04 and the verifier correction were fast-forwarded and pushed
at `6aa275b6c5c7ae2138a530888093ef30230a4234`. Vercel
`dpl_8zRNoRJgWedSKVh9W2tpUUKvF5zz` reached READY at the matching SHA.
Full verification passed (2,236 tests / one existing skip; 24 existing lint warnings).
Login/session and protected-route smoke checks passed; bounded runtime error/fatal/5xx
scans were empty. The build-log connector was unavailable, and authenticated production
visual review remains manual. Historical local-only evidence below is preserved.

Branch: `refactor/schedule-read-architecture`.
Worktree: `../biwengerstats-next-schedule-read-architecture`.
Base: `52564d056a68cb46319fe73cbfc03c0c9145763d`, carrying Tasks 01–03 documentation
on application main `1933e033434d5a35564b199705a40836f6ebed81`.
This is local implementation only: no merge, push or deployment authorized.

Implementation commit: `84e0721a5c6e2331fd9193f3fc91a9935fcefb62`.
At the original Schedule handoff, unconditional acceptance remained open because the existing
verification wrapper failed as documented below. The separately authorized isolation follow-up
at the end of this receipt records the correction; historical failed runs are retained.

## Scope and contracts

- `/schedule`: session-selected manager, desktop schedule and phone timeline.
- `/schedule/map`: existing mobile-only map and desktop redirect to `/schedule`.
- No Schedule read HTTP endpoint exists; no new endpoint is introduced.
- Keep permissive `parseInt` query behavior, including repeated values, zero/NaN fallback,
  unknown-round fallback to latest dated match, and active-or-next round resolution.
- Map selection remains the existing Matches policy, not the Schedule policy.
- Phone map link deliberately still drops the selected round; map back link keeps its resolved round.
- Preserve Madrid date grouping, match/date ordering, stable descending fantasy-point order,
  entire-squad summary and empty-squad/no-round differences between desktop and phone.
- Parent authentication, loading and error boundaries remain unchanged.
- Session-specific Schedule reads introduce no shared cache, internal REST or provider request.

## Ownership

Schedule owns the session-specific read composition and read screens. Matches owns match-backed
round options and short-name/provider-code fixture projections. Managers owns the narrow current
owned-player projection, including existing official image/code precedence. These are distinct
from the existing full match-map and enriched manager-squad contracts; substituting those would
change left joins, field precedence, ordering or dependencies. Rounds retains selection policy.
All cross-feature access is through deliberate public/server entrypoints.

Assistant's three existing context builders still consume `getUserScheduleService` through the
global service barrel. A thin compatibility adapter delegates to Schedule and restores the old
Date-valued match projection without the mobile list-item field. It owns no query or calculation;
Task 20 will retire it when Assistant adopts the deliberate contract. No Assistant source changed.

`AutoAlignButton`, `LineupModal`, the API client and `/api/users/lineup` remain unchanged.
Schedule retains an explicit typed compatibility bridge to that legacy command UI; its ownership
migration belongs to Task 15, not this read slice. Browser read tests refuse lineup submission.
Existing command response logging is not newly certified safe by this structural task and must
be inspected at the sensitive-operation inventory/security gate.

## Resulting structure and removals

`src/features/schedule` owns models, compatibility validation, a mapper, read services,
desktop/mobile/map screens and read cards/controls. Its public and server entrypoints remain
separate. Schedule contains no persistence access; the five extracted query bodies live in
Matches (four fixture/calendar projections) and Managers (one owned-player projection).
All five bodies match the original ignoring imports/whitespace; joins, season scoping, provider
display mappings and ordering are unchanged. This does not replace the distinct full map query.

Four read components moved from `src/components/schedule`; their non-import emitted JavaScript
is unchanged. Desktop composition moved out of the page; mobile composition moved out of the
global mobile folder. The unused legacy Schedule RoundSelector had no remaining consumers and
was deleted. AutoAlignActionRow remains with the untouched command UI for Task 15.
The old global Schedule query implementation and unused round-service export were removed.
The Schedule service filename remains solely as the documented Assistant adapter.

Both pages are architecture-protected. Six exact pre-existing auth/credential infrastructure
edges follow the established Rounds exception pattern, with removal assigned to the Accounts
security gate. No feature query exemption or graph relaxation was added.

## Compatibility and observability

Internal dates are now ISO strings; the Assistant adapter restores Date objects for its unchanged
legacy contract. The UI model retains explicit legacy field names for existing read components
and the frozen command bridge, rather than passing query objects through. The phone Matches row
projection moved from presentation into the mapper. Nullable names, IDs and points are preserved.
Ordinary Error/string-message failures retain their rendered message; raw error objects are no
longer printed by the migrated Schedule service. No new logging of personal data was added.

## Acceptance evidence

- Baseline `npm run verify`: skills, graph, docs and typecheck passed; stopped at the existing
  config test `requires credentials and database configuration`. The wrapper supplies
  `SKIP_DB=true` to tests, while that test expects absent DB configuration to throw.
- Baseline direct `npm run test:run -- --maxWorkers=2`: 2,189 passed, one existing skip.
- Baseline lint: zero errors, 24 existing image warnings.
- Original disposable browser capture: 2/2 desktop/iPhone cases, three macOS references, built
  from unchanged application source at `1933e033` before source edits. Both read overviews were
  visually inspected. The fixtures contain only synthetic local data.
- Candidate `npm run test:e2e:local -- schedule.spec.ts`: 9/9 viewport cases passed, including
  the three unchanged original references. Browser/API error guards were not weakened. The
  test refuses lineup submission; no real provider command or production connection was used.
- Focused Schedule/Matches/Managers/Assistant suite: 222 tests passed before the final adapter
  and error-object tests; final rerun recorded below.
- Final focused command: `npm run test:run -- src/features/schedule src/app/\(app\)/schedule src/features/matches src/features/managers src/lib/services/app/scheduleService.test.ts src/lib/services/features/__tests__/assistantContextService.test.ts --maxWorkers=2`: 225 passed in 34 files.
- Final `npm run test:run -- --maxWorkers=2`: 2,229 passed, one existing skip (270 passing files).
- Final `npm run verify`: skills (six), architecture (938 modules, 65 protected entrypoints),
  docs (98 notes) and typecheck passed. Tests: 2,228 passed, one failed, one skipped; the only
  failure is the same baseline `SKIP_DB` configuration expectation. The wrapper stops there.
  This is not a green `verify` result; no test was disabled or relaxed.
- Remaining commands were run separately: `npm run lint` passed with zero errors and the same
  24 image warnings; `SKIP_DB=true npm run build` passed and registers both Schedule routes as
  dynamic. Missing-provider warnings match the baseline.
- `npm run db:audit:schema:metadata` passed: 37 source/snapshot tables, no drift, no DB connection.
  `npx --no-install drizzle-kit check` passed. Neither check applies migrations.
- Final documentation formatting/check and `git diff --check` passed.

At the original handoff, the verification-wrapper issue required a separate tooling correction: decide whether the
wrapper should scope `SKIP_DB` to the build or whether the config test must isolate imported
configuration state. Do not simply remove the missing-database assertion. Re-run the wrapper
after that reviewed correction before marking unconditional acceptance complete.

Linux Schedule screenshots are not established; Linux semantic checks remain enabled. Real-data
production visual review belongs to a later separately authorized release. The default fixture
contains one match and one owned player; multi-player ordering, empty/error and identity cases
are covered by service/page tests rather than claimed as populated browser coverage.
No current production behavior or deployment is certified by this report.

## Configuration-test isolation follow-up

Branch: `fix/verifier-config-isolation`, worktree `../biwengerstats-next-verifier-config-isolation`,
based on Schedule receipt `1aaf3376`. The original Schedule branch is left unchanged.

Fix commit: `344ed0e85150c7961e76a61939ceadd65024e23d`. Task 04 is now **verified locally**
on this combined Schedule-plus-fix branch, not merged or deployed.

The original four-test config suite failed under `SKIP_DB=true` and the same missing-database
assertion passed when imported with `SKIP_DB=false`. `validateSeasonConfig` uses both its explicit
environment argument and `CONFIG.DB.SKIP`, captured at module import. The test had controlled only
the former. Removing the verifier flag would also remove its mock-pool safeguard, so that option
was rejected.

The config test now resets modules and sets its import environment before loading the real config
module, then restores environment/module state after each test. The original missing-database
assertion is unchanged. Added tests cover explicit skip, import-time skip despite later environment
changes, and retained provider validation. Verifier tests mock process spawning, not validation:
they verify disabled DB access in every child with absent/false/true inherited flags, unchanged
parent environment, command ordering and fail-fast behavior. They never start child commands or
record the inherited environment.

No runtime configuration, verifier implementation, database client, schema, dependencies or Schedule
application code changed. No production or provider operations were performed.

- Focused config tests: 6/6 passed under both `SKIP_DB=true` and `SKIP_DB=false`.
- Combined config/verifier regression tests: 11/11 passed under `SKIP_DB=true`.
- `npm run verify`: **PASS**, exit 0. Six skills, architecture (938 modules / 65 protected
  entrypoints), documentation (98 notes), typecheck, 2,236 tests passed / one existing skip,
  lint (zero errors / the same 24 image warnings), database-disabled production build,
  schema metadata (37 source and snapshot tables, no drift), Drizzle check and diff check all passed.
  Missing-provider build warnings remain unchanged. No tests or safety flags were disabled.
- Browser tests are not repeated for this test-only correction. The unchanged Schedule source retains
  the preceding 9/9 viewport and original-reference acceptance; Linux references and production
  visual review remain the documented follow-ups, not newly claimed checks.
