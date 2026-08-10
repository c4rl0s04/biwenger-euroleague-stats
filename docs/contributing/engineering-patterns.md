---
title: Engineering Patterns
description: Current implementation patterns and known transitional exceptions.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Engineering patterns

## Query, service, route, UI

For a normal data-backed feature:

1. Add pure reads under `src/lib/db/queries/<domain>/` or idempotent writes under
   `src/lib/db/mutations/`.
2. Put orchestration and result shaping in `src/lib/services/`.
3. Keep the route handler focused on HTTP authentication, validation, cache policy, and response.
4. Render the behavior in the domain component and keep the page entry responsible for routing and
   composition.

Some older and specialized routes still access the data layer directly. Do not expand that
exception without an explicit reason.

## Sync pipeline

Sync follows extract, transform, and load steps registered by number in the orchestrator. Writes use
upserts or equivalent conflict-safe operations. The manager supplies shared context, locking,
season validation, failure behavior, and cache invalidation.

## Server and client split

Keep non-interactive page composition on the server. Introduce a client boundary only where state,
effects, browser APIs, or event handlers require it. Server-exclusive modules should declare
`server-only` so they cannot be bundled into client code accidentally.

## Client fetching and response helpers

[`useApiData`](../../src/lib/hooks/useApiData.js) standardizes loading, errors, dependency-based
refetching, response unpacking, and cancellation for many client views. Most endpoints use
[`successResponse` and `errorResponse`](../../src/lib/utils/response.ts), but contract tests remain
the source of truth for endpoints with specialized responses.

## Validation boundary

Validate path, query, and body input before it reaches domain or database operations. The typed
validators in [`validation.ts`](../../src/lib/utils/validation.ts) use discriminated results so
routes handle invalid values explicitly.

## Incremental TypeScript

Database, service, API, and sync boundaries are predominantly TypeScript. Many React components are
still JavaScript. Preserve type safety at server and data contracts without performing unrelated
bulk UI conversion.

## UI registries

Complex metric presentation can be selected through registries rather than large conditional
components. The market statistic renderers are the clearest example. Use this approach when several
metrics share layout but require distinct matching, formatting, and summary strategies.
