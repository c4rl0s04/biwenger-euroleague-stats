---
title: Testing
description: Test organization, safety rules, commands, and acceptance expectations.
audience:
  - newcomer
  - contributor
  - maintainer
  - agent
status: active
---

# Testing

Vitest is the primary automated test runner. Tests are colocated with route, query, sync, logic,
utility, and constant modules; shared setup lives in [`src/tests/setup.ts`](../../src/tests/setup.ts).
Playwright is installed for browser-level verification, but there is no repository-wide Playwright
suite or `test:e2e` package command at present.

## Commands

```bash
npm test
npm run test:run
```

Use Vitest's path and name filters for focused development. Always run `npm run test:run` before
integration because shared service exports, schema types, and configuration can affect distant
suites.

## Test families

- **Route contract tests** mock services/data access and verify status, validation, response shape,
  authentication, and error handling.
- **Domain logic and utility tests** exercise deterministic analytics, scoring, dates, caching,
  formatting, and validation.
- **Sync tests** cover step behavior, manager failure semantics, preflight, workflow configuration,
  season guards, and idempotent transformations.
- **Database query/integration tests** verify SQL behavior where a disposable PostgreSQL target is
  explicitly available.

## Database safety

Database-backed suites are optional by default. Use a disposable local database and enable them only
through their documented flag, normally `RUN_DB_TESTS=true`. The test guard rejects remote-looking
targets unless `ALLOW_REMOTE_TEST_DB=true` is explicitly set.

That override is not routine CI configuration. Never point destructive or fixture-loading tests at
production or a database containing non-reconstructable league history.

## What to cover

- Successful behavior plus invalid, unauthenticated, empty-data, and provider-failure cases.
- API method, URL parameters, status, cache behavior, and response envelope when a route changes.
- Season identity and user authorization for data writes.
- Idempotency, partial provider data, and critical-step behavior for sync changes.
- Formula boundaries, ties, missing rounds, and zero/empty inputs for analytics.

Tests should use sanitized fixtures and deterministic dates/IDs. Do not record real provider tokens,
private league payloads, or production assistant conversations.

## CI baseline

The main CI workflow installs with `npm ci`, then runs lint, typecheck, the Vitest suite, and a
database-skipping production build. A separate formatting job checks repository source formatting;
the documentation check supplements it with vault metadata and link validation.
