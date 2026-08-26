---
title: 'ADR-0004: Single-Source Declarative Synchronization'
description: Decision to remove runtime provider selection and organize ingestion by explicit ownership.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# ADR-0004: Single-source declarative synchronization

- **Status:** accepted
- **Date:** 2026-08-26
- **Supersedes:** [ADR-0003](0003-guarded-idempotent-sync.md)

## Context

The 2026-27 integration temporarily kept the previous EuroLeague clients, numeric step layout,
provider selector, and separate routine/live entry points. That made the current data path harder to
follow and left multiple modules capable of writing the same facts.

## Decision

Use EuroLeague Advanced API as the only active official sporting source from 2026-27 and keep
Biwenger as the fantasy source. Declare the ordered pipeline in one registry where every step has a
descriptive ID, source, writes, modes, and dependencies. Run routine, bootstrap, and live modes
through the same manager and advisory lock.

Retain the safety properties of the previous pipeline: validate schema readiness, require an active
season bound to the configured league, reject historical writes, use idempotent mutations, and stop
on the first step failure.

Keep the removed implementation in the `archive/euroleague-legacy-2025-26` Git tag instead of an
active source folder. Separate HTTP clients, synchronization services, and database mutations. Give
fantasy points and sporting statistics independent writers, and make the squad step the sole owner
of current ownership.

## Consequences

There is one production path to trace and no runtime fallback capable of mixing official providers.
Targeted recovery uses stable descriptive IDs. A provider outage stops the affected pipeline and
requires a later retry; rollback to legacy code is a deliberate Git operation, not configuration.

Bootstrap-only derived data must be requested explicitly. Adding a step requires declaring its
ownership and dependencies and extending the pipeline contract tests.

## Alternatives considered

- Keep both official providers behind an environment selector: rejected because it preserves
  duplicate behavior and increases the chance of mixed semantics.
- Move old code into a runtime `archive/` directory: rejected because it remains searchable and can
  accidentally return to the dependency graph.
- Preserve numeric step aliases: rejected because gaps and historical meanings obscure intent.
