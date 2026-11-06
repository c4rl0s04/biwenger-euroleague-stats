---
title: Configuration implementation evidence
description: Local implementation evidence and remaining release gates for the configuration simplification.
audience:
  - maintainer
  - operator
  - agent
status: draft
---

# Configuration implementation evidence

Branch: `refactor/config-simplification`, based on the plan at `9b47650f` and source main
`e0a28e19`. Worktree: sibling `biwengerstats-next-config-simplification`.
The [implementation plan](../architecture/configuration-simplification-plan.md) defines ownership;
the [cutover checklist](configuration-cutover.md) defines remaining operator actions.

## Prepared changes

- One validated application database URL across runtime, Drizzle, maintenance and workflows;
  PostgreSQL container initialization remains separate. Existing TLS behavior is preserved.
- Database-owned season resolution and metadata, without environment/historical read fallbacks;
  writable sync context and per-job discovered ingestion identity replace global configuration
  mutation. The provider discovery request can bootstrap without pre-existing identity headers.
- Explicit season IDs at seasonal write boundaries; migration 0021 removes defaults only, without
  changing records. Historical reports and dated roster artifacts retain their explicit scope.
- Personal provider actions retain encrypted manager credentials, use the selected active league,
  and reject historical mutations. The same private account allowlist moves to
  `PERSONAL_BIDS_USER_ID`; it is not inferred from the ingestion token.
- Setup masks secrets, refuses overwrites, creates mode-0600 settings and optionally generates new
  credential keys only for new setup. Existing deployments keep their original session/encryption
  secrets. The unused access password is removed.
- CLI environment loading has one precedence rule. Assistant `AI_MODEL` simplifies model selection;
  old aliases and implicit provider selection remain temporarily to preserve uninspected deployments.
  Browser Sentry reads only its public DSN; server override/redaction remain supported.

## Local verification

Commands used Node 24.20.0 via `npx -p node@24.20.0` or that cached executable. Worktree dependencies
were installed with `node scripts/dev/worktree.mjs setup`; no environment files were copied.

| Check                                                                                                                                                           | Result                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused baseline: configuration, database/season resolution, provider boundaries and bidding                                                                    | 63 passed across 14 files before edits.                                                                                                                                             |
| Focused Vitest selection across changed owners, DB/credential safety, assistant, home/player queries, setup/loading/lifecycle parsing and seasonal architecture | 403 passed, 3 skipped across 63 files. Skips are existing opt-in DB/disabled tests, not substitutes for the disposable checks below.                                                |
| Final URL/credential/allowlist/setup rerun after malformed-URL validation                                                                                       | 28 passed across 4 files.                                                                                                                                                           |
| `vitest run --maxWorkers=2 scripts/db/season-lifecycle.integration.test.ts`                                                                                     | Passed against a fresh disposable database: create, conflicting activation, freeze and concurrent sync-lock denial.                                                                 |
| `npm run typecheck`                                                                                                                                             | Passed; rerun after final source/test edits.                                                                                                                                        |
| `npm run architecture:check`                                                                                                                                    | Passed: 1,118 modules and 132 protected entrypoints.                                                                                                                                |
| ESLint on changed JS/TS/MJS files                                                                                                                               | Passed.                                                                                                                                                                             |
| `npm run db:audit:schema:metadata`                                                                                                                              | Passed offline for 39 source/snapshot tables.                                                                                                                                       |
| `drizzle-kit check`                                                                                                                                             | Passed without database credentials; offline metadata checks do not require a connection.                                                                                           |
| `npm run test:db:local`                                                                                                                                         | Passed: all 22 migrations, no seasonal schema defaults, schema readiness, composite keys and RLS/grant checks; disposable cluster removed.                                          |
| `npm run test:e2e:local -- --project=desktop-1440 --project=iphone-13 --grep 'Home preserves\|migrated feature screens'`                                        | 4 passed, including real fixture login, desktop/phone home and feature-screen assertions/screenshots. Harness also checks mixed-season integrity in a separate disposable database. |
| Docker Compose rendering with synthetic local and remote URLs                                                                                                   | Passed: application/sync receive the same single URL, without split application settings or environment season metadata. No containers or remote connections were needed.           |
| Prettier on changed authored files; `node scripts/dev/check-docs.mjs`; `git diff --check`                                                                       | Passed.                                                                                                                                                                             |

The initial browser attempt exposed the fixture's dependence on the retired season fallback. It was
interrupted, and the harness now activates its own synthetic season explicitly before starting the
app. The separate integrity fixture retains its frozen history. The final browser run passes.

The database-disabled build inside the browser harness succeeds without provider credentials. Its
speculative prerender logs an active-season lookup warning from the mock database; the server uses
the real disposable database at runtime. A desktop chart emits a size warning during the successful
browser test. Neither is evidence of live database/provider verification.

## Remaining release gates

No hosted environment was edited, no live provider request or mutation was used for validation,
no existing database was migrated, and no deployment was performed. The full unit/lint/browser CI
matrix has not been run locally; CI is pending on the implementation PR and must pass before merge.

An operator must provision the names in the cutover checklist and review migration application and
rollback. AI aliases/implicit selection are deliberately not removed until matching explicit
settings are confirmed everywhere. The cutover checklist remains unchecked; this is implementation
preparation, not production release acceptance.
