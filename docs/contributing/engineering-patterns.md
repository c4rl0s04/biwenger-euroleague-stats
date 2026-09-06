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

New or migrated domains follow [the feature architecture](../architecture/application-layers.md):

1. Put queries/repositories, mappers, services, typed view models, and screens under their owning
   `src/features/<feature>` boundary.
2. Expose client-safe `public.ts` and server-only `server.ts` contracts; consume other features
   through those contracts rather than internal files.
3. Pages invoke services directly. Retained HTTP handlers adapt the same services while preserving
   authentication, validation, response and cache behavior.
4. Keep domain components separate from domain-agnostic UI primitives.

Unmigrated global queries/services/mutations remain supported. Their paths are compatibility
locations, not the default for new domain code. See the [migration ledger](../architecture/migration-status.md).

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
