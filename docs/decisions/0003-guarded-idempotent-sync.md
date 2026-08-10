---
title: 'ADR-0003: Guarded Idempotent Sync Pipeline'
description: Decision to ingest provider data through ordered, locked, season-aware steps.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# ADR-0003: Guarded idempotent sync pipeline

- **Status:** accepted
- **Date:** 2026-08-10
- **Supersedes:** none

## Context

Provider data has ordering dependencies, can be partially unavailable, and writes into historical
fantasy records that cannot always be reconstructed. Scheduled, manual, and live jobs can otherwise
overlap or target the wrong season.

## Decision

Run ingestion through numbered steps managed by a shared orchestrator. Require advisory locking,
schema readiness, an active season bound to the configured league, idempotent writes, and fail-fast
critical steps by default.

## Consequences

Interrupted work can normally be rerun and concurrent jobs skip safely. New sync behavior must fit
the step dependency model and carry season context. Explicit diagnostic overrides remain exceptional
and are forbidden as routine production configuration.

## Alternatives considered

- Independent uncoordinated scripts: rejected because concurrency and ordering become unsafe.
- Rebuild the database from providers on every run: rejected because provider history is incomplete
  and private production data is not fully reconstructable.
