---
title: Task 25 deferred authentication ownership
description: Authentication and credential contracts, exception retirement and remaining UI dependencies.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 25 — Deferred authentication ownership

Base: merged main `c0c91dd4` (PR #50). Implementation branch:
`refactor/auth-ownership`, in sibling worktree `biwengerstats-next-auth-ownership`.
25A and 25B are integrated; their receipts describe their original pre-merge verification.
This receipt covers the deferred architecture work, not the parallel UI migration.

## Permanent infrastructure boundaries

`src/auth.js` remains the deliberate NextAuth framework contract (`auth`, `handlers`,
`signIn`, `signOut`) and now carries a server-only marker. Its login lookup and JWT
account refresh queries live in `src/lib/auth/repository.ts`. Query predicates,
projections, password checks, callbacks, session strategy, refresh triggers and error
behavior are preserved. These reads are uncached and use the existing database client.
No extra authentication wrapper or domain feature is introduced.

`src/lib/credentials/server.ts` exposes the existing credential service instance.
Authentication, Accounts and Provider consumers use this contract. Repository, crypto,
keyring and service construction stay private to credential infrastructure. Browser-safe
error/type modules remain separately accessible. The operator maintenance command retains
its existing internal access; it is an operational script, not an application entrypoint.
Encryption, rotation, secret storage and provider operations are unchanged.

The architecture checker independently validates exact dependency sets for authentication
and credential modules, including repository-only database access, server-only markers and
computed imports. It rejects outside deep imports and runtime client leaks (including
legacy clients outside feature directories). Framework traversal stops at the reviewed
contracts while the internal dependency checks continue to apply. This replaces 216
repeated per-entrypoint exceptions with zero exceptions; it does not permit arbitrary
persistence behind an unchecked helper. The NextAuth HTTP handler joins the protected
entrypoints, raising coverage to 125. Health remains operational database infrastructure.

## Remaining ownership and UI handoff

| Item                                                                      | Owner and acceptance condition                                                                                                    |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and credential infrastructure                              | Permanent shared server infrastructure, enforced by the new boundary checks; regression results below.                            |
| Section and shell registration                                            | UI-01C owner: adopt its composition contract, then recheck all callers before retiring compatibility.                             |
| MobileHeaderActions and UserAvatar integration                            | UI-01C/UI-02 owner: preserve capability placement and callers during adoption.                                                    |
| Legacy Card variants, CardThemeContext, ThemeBackground and ThemeSwitcher | UI/feature adoption owner: migrate actual consumers before removing dispatch or theme compatibility.                              |
| Retained analytics, thresholds and mobile-state helpers                   | Retain pending consumer/test inventory and the owning adoption decision; zero runtime callers alone is not removal authorization. |

The [25B caller inventory](task-25b-ui-inventory.json) is the starting handoff, not a
claim about the other agent's unmerged branch. Re-run the UI audit on the eventual combined
main after that work integrates. No UI code or other worktree was changed here.
Full Task 25 remains open until these temporary UI boundaries are retired or explicitly
accepted as permanent. Tasks 26 and 27 still own broad regression acceptance and release
verification respectively; neither is completed by this structural change.

## Verification

Baseline architecture: 1,061 modules / 124 protected entrypoints / 216 exceptions.
Baseline focused auth/credentials/provider/architecture tests: 211 passed.
After implementation, the initial expanded focused suite passed 241 tests. The final
expanded run passed 273 tests and timed out on one existing bcrypt password test at
five seconds. Re-running the affected Accounts file with a 30-second timeout passed
all 12 tests; no assertions or checked-in timeouts were changed.

Commands and results:

- `SKIP_DB=true npm run test:run -- src/lib/auth src/lib/credentials src/features/accounts src/features/provider/server/__tests__ src/app/api/user src/tests/architecture scripts/architecture/check.test.mjs --maxWorkers=2`: 273 passed, one timeout as described above.
- `SKIP_DB=true npm run test:run -- src/features/accounts/__tests__/account-command.service.test.ts --maxWorkers=1 --testTimeout=30000`: 12 passed.
- `npm run architecture:check`: passed; 1,063 source modules, 125 entrypoints, zero exceptions.
- `node scripts/architecture/ownership-inventory.mjs`: completed; 1,115 runtime modules.
- ESLint on all changed/new JavaScript and TypeScript files: passed.
- `npm run db:audit:schema:metadata` and `drizzle-kit check`: passed, without database connections; 37 tables match.
- `git diff --check`: passed.
- `npm run docs:check`: passed after correcting the stale links.
- `SKIP_DB=true npm run typecheck`: stopped after several minutes without a result, respecting the requested fast handoff; typecheck remains pending.

The clean-checkout documentation check exposed five existing links to the retired
`src/lib/services` directory. The affected implementation maps now point to feature
ownership rather than an empty local directory left behind by earlier work.

Per the user's earlier instruction, full suites, production build and browser matrices
are deferred to CI/Task 26. This is not real-browser login or deployment acceptance.
No production data access, schema migrations, secret changes or provider mutations were
performed. The branch is not merged or pushed by this implementation task.
