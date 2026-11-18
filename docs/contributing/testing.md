---
title: Testing
description: Unit, architecture, schema, and deterministic browser verification.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Testing

## Focused local verification and CI

Use the pinned Node version and run focused Vitest tests during development:

```bash
npm run test:run -- src/features/teams
git diff --check
```

Choose additional checks based on the changed files and risks: `npm run architecture:check` for
feature boundaries, `npm run docs:check` for documentation, `npm run skills:check` for repository
skills, schema metadata checks for database-backed models, and focused Playwright projects for
changed browser behavior. Typecheck, lint, or build locally when a specific change or failure
needs them. Record what ran and what CI has not yet checked.

The optional `npm run verify` command runs, in order: skills packaging, architecture graph,
documentation, typecheck, all Vitest tests (`--maxWorkers=2`), lint,
`SKIP_DB=true npm run build`, `npm run db:audit:schema:metadata`,
`npx --no-install drizzle-kit check`, and `git diff --check`. Agents do not run it by default
before handoff because CI repeats these checks. After a pull request is opened, leave full
validation to CI and do not wait for or poll its completion. A pending check is not a pass;
investigate failures when the user asks, and require green CI before merging.
The schema checks compare committed metadata and never connect to a database. Build warnings about
absent provider configuration are expected in a database-disabled environment; inspect unexpected warnings.

`npm test` starts watch mode; use `npm run test:run` for a terminating run. Unit tests are colocated
with their modules; tooling tests live alongside scripts. [Vitest setup](../../src/tests/setup.ts)
mocks authentication and request headers for isolated tests.

The verifier keeps `SKIP_DB=true` in every child process, so accidental imports of the canonical
database client use its mock pool. Configuration-validation tests must control both their explicit
environment input and import-time configuration: `CONFIG.DB.SKIP` is captured when `config.js`
loads. The config suite resets modules, stubs `SKIP_DB` before importing, and restores environment
state afterwards. It still asserts that missing database configuration is rejected when skipping
is disabled, and separately tests explicit and import-time skip behavior. Do not remove database
safety flags or missing-configuration assertions merely to make the verifier pass.

## Browser verification

[Playwright configuration](../../playwright.config.ts) covers compact phones, iPhones, Android,
tablet, landscape, and desktop. Browser projects run with one worker to bound WebKit memory usage.
Tests exercise public PWA pages, real login, app navigation, home
filters/sheets, and migrated feature screens.

For reproducible authenticated tests, use a clean task worktree with no `.env` files, local
PostgreSQL binaries (`initdb`, `pg_ctl`, exposed by `pg_config` or `PG_BINDIR`), and Playwright browsers:

```bash
npx --no-install playwright install chromium webkit
npm run test:e2e:local
```

The runner starts a fresh loopback PostgreSQL cluster on a free port, creates a uniquely named
`biwenger_e2e_` database, applies existing committed migrations, and seeds synthetic managers and
league data. It builds the app without DB reads, starts it with an isolated synthetic environment,
and runs tests through the existing credentials login flow. It never loads application `.env` files,
provider credentials, real data, or an auth bypass. The cluster and application are stopped and the
fixture directory is removed on success/failure or interrupt.

Fixture setup refuses remote targets, non-fixture names, ambiguous connection options, missing
disposable markers, and nonempty databases. No production schema or migration is changed by this workflow.

For a focused run, pass Playwright filters:

```bash
npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440
```

To exercise an independently configured local app, `npm run test:e2e` accepts `PLAYWRIGHT_BASE_URL`,
`E2E_USERNAME`, and `E2E_PASSWORD`. Authenticated cases skip without credentials only in this optional
manual mode. CI and the disposable runner require credentials and fail if they are missing.

CI uses [the pinned Linux browser container](../../scripts/e2e/Dockerfile), including Node 24.20.0,
PostgreSQL 16, and the Playwright version pinned in `package.json`.

Reproduce the same Linux/arm64 environment locally with Docker. Validate Playwright upgrades
against the retained references and update the package and image pins together.

```bash
docker build --platform linux/arm64 -f scripts/e2e/Dockerfile -t biwenger-e2e .
docker run --rm --init --ipc=host --platform linux/arm64 biwenger-e2e
```

To refresh Linux baselines deliberately, mount only the snapshot directory and pass `--update-snapshots`:

```bash
docker run --rm --init --ipc=host --platform linux/arm64 \
  -v "$PWD/tests/e2e/feature-screens.spec.ts-snapshots:/workspace/tests/e2e/feature-screens.spec.ts-snapshots" \
  biwenger-e2e --project=iphone-13 --project=desktop-1440 --update-snapshots
```

Visual comparisons cover Matches and Team Profile on iPhone 13 and desktop 1440, using separate
committed macOS and Linux baselines. All nine projects run semantic behavior checks. Map controls
and rendering execute, but live tiles use a deterministic test style and the canvas is hidden only
during screenshots. Service workers are blocked to make request interception deterministic; PWA
checks verify public routes, manifest, and worker response headers, not installed offline caching.
Local Vercel analytics script requests receive an empty script because this harness is not hosted on Vercel.

Visual comparisons use committed platform-specific snapshots. Intentional visual changes require
inspecting the result and updating the applicable baselines with `npm run test:e2e:update`.
Browser failures retain screenshots and traces in `test-results/`. CI uploads those artifacts.
See the [historical capture notes](../migration/browser-verification-history.md) for provenance.

## Test responsibilities

- Route contracts: actual handlers, identity precedence, status codes, validation, envelopes,
  authorization, cache headers, and error paths with mocked data access.
- Services/mappers: success, empty, not-found, deterministic ordering, serializable output, and errors.
- Architecture: resolved imports, transitive client safety, ownership, and cycles, including negative fixtures.
- Tooling safety: refuse unsafe fixture database targets; no real provider mutations.
- Domain logic/sync: scoring, dates, pagination, seasons, idempotency, and partial provider data.

Existing database integration suites remain optional and require an explicitly disposable database,
normally `RUN_DB_TESTS=true`. Never enable remote overrides to make a local check pass.

CI runs lint, typecheck, docs, skills, architecture, unit tests, schema checks, the database-disabled
build, formatting, and a separate disposable browser job. The runtime is shared through `.nvmrc`.
