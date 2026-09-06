---
title: Agent setup implementation status
description: Completion checklist and validation evidence for the agent workflow improvements.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Agent setup implementation status

This task starts from main `376814b6` in `chore/agent-workflow-setup`.

## Completion checklist

- [x] Reconcile agent entrypoints and canonical architecture/testing guidance.
- [x] Curate portable skills and validate the migration and UI workflows.
- [x] Enforce architecture ownership, transitive client safety, and cycles with negative tests.
- [x] Pin the local/CI runtime and verify repeatable worktree setup and actions.
- [x] Document existing design authority and preserve application UI.
- [x] Run disposable authenticated browser tests and reviewed visual comparisons.
- [x] Integrate verification into CI and complete all local acceptance checks.

## Baseline — 2026-09-06

Node 24.20.0: typecheck passed; full Vitest suite passed (678 tests, one existing skip);
lint passed with 29 existing image warnings; docs passed (49 notes); database-disabled production
build passed; schema metadata audit and Drizzle check passed. Dependencies installed with
`npm ci --ignore-scripts --no-audit --no-fund`. No environment files or live databases were used.

## Implementation evidence

- Root AGENTS.md owns task routing and compatibility rules; Copilot and legacy agent instructions link
  to it. Architecture, development, testing, and design guidance now describe the current feature model.
  Next.js adds its own delimited framework guide block during `next dev`; it is committed to prevent drift.
- Six portable repository skills remain. The feature-migration and project-ui skills passed the bundled
  skill-creator validator, and `npm run skills:check` validates every package and local reference.
- The architecture graph checks 670 source modules and seven migrated entrypoints, with one exact,
  documented Matches-to-round-policy exception. Ten negative/positive architecture tests pass.
- Node 24.20.0 setup ran successfully with `npm run worktree:setup`. Wrong-runtime rejection, stable
  port selection (3885), and occupied-port fallback (3886) were verified. The Codex environment TOML
  and CI YAML parse successfully; the setup and three action commands are present.
- `SKIP_DB=true AUTH_SECRET=local-setup-smoke-only npm run dev:worktree` started the login page.
  agent-browser verified the form, meaningful content, no framework error overlay or page exception,
  and unauthenticated home-to-login navigation. The screenshot was inspected and the server stopped.
  The Codex UI buttons themselves have not been clicked; their underlying commands were exercised.
- The disposable fixture applies existing migrations to a new local PostgreSQL cluster, seeds only
  synthetic data, and uses real credentials authentication. Seven safety tests reject unsafe targets.
  Failed and successful browser runs shut down their temporary app/database processes.

## Acceptance commands

Commands below use Node 24.20.0 (via the version manager or
`npm exec --yes --package=node@24.20.0 -- <command>` on this host).

| Command                                                       | Result                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run worktree:setup`                                      | Passed; clean dependency installation and Husky preparation |
| `npm run verify`                                              | Passed all sequential checks                                |
| `npm run skills:check`                                        | Passed; six skills                                          |
| `npm run architecture:check`                                  | Passed; 670 modules, seven protected entries                |
| `npm run docs:check`                                          | Passed; 52 notes                                            |
| `npm run typecheck`                                           | Passed                                                      |
| `npm run test:run -- --maxWorkers=2`                          | 695 passed, one existing skip                               |
| `npm run lint`                                                | Passed; zero errors, 29 pre-existing image warnings         |
| `SKIP_DB=true npm run build`                                  | Passed                                                      |
| `npm run db:audit:schema:metadata`                            | Passed; 38 source/snapshot tables agree                     |
| `npx --no-install drizzle-kit check`                          | Passed                                                      |
| `npx prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}"` | Passed                                                      |
| `git diff --check`                                            | Passed                                                      |

`npm run test:e2e:local` passed all 45 macOS browser cases with no retries or snapshot updates.
The reviewed macOS and Linux baselines cover Matches and Team Profile at iPhone 13 and desktop 1440.
The Linux/arm64 container passed all 45 cases with `CI=true --reporter=list --retries=0`,
including four unchanged screenshot comparisons. The complete browser runs used no retries or
snapshot updates. Both fixture clusters stopped and cleaned up successfully.

Linux reproduction used:

```bash
docker build --platform linux/arm64 -f scripts/e2e/Dockerfile -t biwenger-agent-e2e .
docker run --rm --init --ipc=host --platform linux/arm64 -e CI=true \
  biwenger-agent-e2e --reporter=list --retries=0
```

The final macOS follow-up repeats the corrected public-PWA case twice across every device:
`npm run test:e2e:local -- --grep 'public PWA routes' --repeat-each=2` — all 18 cases passed without retries.

## Scope and limitations

The only application CSS change uses the existing safe-area token consistently; its default remains
the browser safe-area value. No feature migration, visual redesign, dependency version upgrade,
authentication change, production operation, or schema change is included. TypeScript 5.9.3 became
an explicit tooling dependency at the version already resolved by the lockfile.

Visual assertions hide live map canvas pixels while retaining layout, markers, and controls. Browser
fixtures block service workers and stub local analytics; installed offline caching, live providers,
and actual geographic tiles are outside these checks. Existing optional DB integration coverage
remains skipped. Linux CI commands are reproduced locally; a hosted GitHub run requires publishing
this branch and has not been performed.

Initial browser runs exposed fixture-ID, stale locator, prefetch timing, safe-area token, and
platform GPU problems. Linux also exposed a hard-navigation race with pending authentication requests;
the PWA test now waits for those requests to settle before navigating. Those were corrected before acceptance. Browser execution is serialized to
bound WebKit memory, and screenshots allow 60 seconds for software rendering. No assertions were
removed to accept errors. The baseline retains the existing product appearance.

One full Linux attempt exited 137 during a concurrent local build/check workload. Docker was restarted
and heavy acceptance runs were serialized. Temporary server logs also contain Next.js stream-closure
messages from canceled prefetches; browser/API error assertions remain enabled.
