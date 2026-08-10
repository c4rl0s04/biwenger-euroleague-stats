---
title: 'ADR-0001: Layered Request Architecture'
description: Decision to separate HTTP, business, and database responsibilities.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# ADR-0001: Layered request architecture

- **Status:** accepted
- **Date:** 2026-08-10
- **Supersedes:** none

## Context

Analytics endpoints combine complex SQL, enrichment, HTTP caching, validation, and UI-specific
shapes. Mixing these responsibilities makes queries difficult to test and contracts difficult to
change safely.

## Decision

Use a directional UI → route → service → query/mutation flow for new data-backed behavior. Keep
HTTP concerns in route handlers, business orchestration in services, and database operations in the
data layer. Migrate direct-access exceptions opportunistically rather than through a disruptive
rewrite.

## Consequences

Queries and services become independently testable and reusable, while routes remain easier to
review. A feature can require several small modules, and transitional direct-access routes must be
recognized rather than incorrectly described as compliant.

## Alternatives considered

- Direct database access in every route: less initial structure but duplicates business rules.
- Server Actions for every interaction: not selected as a repository-wide migration; internal HTTP
  APIs remain established contracts for client components.
