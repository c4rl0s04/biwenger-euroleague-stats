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

## Standard verification

Use the pinned Node version and run focused Vitest tests during development:

```bash
npm run test:run -- src/features/teams
npm run verify
```

The full verification command runs, in order: skills packaging, architecture graph, documentation,
typecheck, all Vitest tests (`--maxWorkers=2`), lint, `SKIP_DB=true npm run build`,
`npm run db:audit:schema:metadata`, `npx --no-install drizzle-kit check`, and `git diff --check`.
The schema checks compare committed metadata and never connect to a database. Build warnings about
absent provider configuration are expected in a database-disabled environment; inspect unexpected warnings.

`npm test` starts watch mode; use `npm run test:run` for a terminating run. Unit tests are colocated
with their modules; tooling tests live alongside scripts. [Vitest setup](../../src/tests/setup.ts)
mocks authentication and request headers for isolated tests.

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
PostgreSQL 16, and Playwright 1.58.2. Reproduce the same Linux/arm64 environment locally with Docker:

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

Manager Profile adds synthetic contributor, season and tournament facts, with semantic
checks across the configured viewports and 14 desktop/iPhone macOS snapshots captured
from the pre-migration implementation (`1a2c0c68`). Its Linux screenshot baseline is
still pending; Linux runs the semantic checks but must not initialize Profile snapshots
from migrated output. Existing Matches and Team Linux comparisons remain enabled.

Manager Profile checks desktop section redirects through the authenticated browser
context's request client, preserving its cookies and user-agent without repeatedly
replacing the live document. It requires an exact 307 destination or the pinned
Next.js streamed redirect error record, rejecting unrelated errors and unsupported
payloads. Negative checks exercise this fixture-specific assertion. Desktop UI and
screenshots remain on the live page; phone sections still use real navigation links.
No prefetch interception, browser-error filtering or snapshot updates are used to
avoid WebKit document-navigation cancellation.

The desktop Profile also brings its chart into view and waits for painted bars and
the two fixture score labels: Recharts' JavaScript animation is not settled by CSS
animation controls. Desktop captures use a resting pointer, an instant scroll reset
and document-coordinate clips for non-chart sections rather than locator auto-scrolling.
The SVG chart stays visible during its locator screenshot; chart tooltips
are tested separately. References come from the original implementation in that same
state, not an axes-only intermediate chart or accidental hover/header positioning.
The desktop overview captures the header/identity viewport; its five section images
cover the full domain content separately, avoiding unreliable offscreen SVG pixels
in a full-document overview. Phone overview captures remain full-page.

Rounds adds historical overview, court, history and comparison coverage, including
all four phone section links and the three desktop lineup modes. Nine macOS images
come from unchanged pre-migration application source at `9d06ee0c` (application
equivalent to `713d2a3b`). Original desktop/iPhone comparisons pass twice without
updating references. All nine viewports run semantic checks; Linux Rounds visual
references remain pending and must not be initialized from migrated output. These
tests use the existing synthetic league and unchanged browser/API error guards.

Visual comparisons use committed snapshots for supported platforms. Intentional appearance changes
require inspecting the output and updating baselines with `npm run test:e2e:update`; never update
snapshots solely to hide a regression. Browser failures retain screenshots and traces in
`test-results/`; CI uploads these artifacts for review. See the [design context](../product/design-system.md).

## Test responsibilities

Standings adds nine phone references (overview plus eight sections) and desktop ranking/progression
references captured from unchanged `38bf2de4` with the same synthetic fixture. The original passed
a second run without snapshot updates. Candidate comparisons must use these images unchanged.
Desktop assertions require both plotted lines and exercise manager filtering; screenshots do not
accept an axes-only chart. Like Rounds/Profile, these new references are macOS-specific; Linux runs
the semantic checks without creating new visual baselines from migrated output.

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
