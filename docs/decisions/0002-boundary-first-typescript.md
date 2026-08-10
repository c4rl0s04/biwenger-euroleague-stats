---
title: 'ADR-0002: Boundary-First TypeScript Adoption'
description: Decision to prioritize TypeScript at data and server boundaries while retaining JavaScript UI.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# ADR-0002: Boundary-first TypeScript adoption

- **Status:** accepted
- **Date:** 2026-08-10
- **Supersedes:** none

## Context

The repository contains a large JavaScript UI and increasingly typed database, service, API, and
sync code. Converting all UI files together would create high churn without proportionate protection
for the most sensitive contracts.

## Decision

Prioritize TypeScript for schema, queries, mutations, services, route handlers, sync orchestration,
and shared domain logic. JavaScript UI code can remain and should be converted when touched where the
benefit justifies the scope.

## Consequences

Server and data errors are caught earlier while UI migration stays incremental. HTTP remains a type
boundary, so route contract tests and runtime validation are important for JavaScript consumers.

## Alternatives considered

- One-time full conversion: rejected because of review risk and unrelated churn.
- JavaScript everywhere: rejected because data and API contracts benefit substantially from static
  checking.
