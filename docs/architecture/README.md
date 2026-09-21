---
title: Architecture
description: Map of the application's system boundaries, flows, and invariants.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Architecture

- [System overview](system-overview.md) — system context, runtime responsibilities, and repository map.
- [Application layers](application-layers.md) — browser-to-database request flow and boundaries.
- [UI component layering target](ui-component-layers.md) — agreed UI composition and reuse direction.
- [UI foundation v1](ui-foundation-v1.md) — implementation-ready foundation for tokens, primitives, compositions, theming, and the Season Predictions pilot.
- [Data and sync](data-and-sync.md) — local-first data ingestion, persistence ownership, and write safety.
- [Authentication and security](authentication-and-security.md) — page protection, credentials, database access, and API responsibilities.
- [Migration master tracker](../migration/tracker.md) — authoritative task states, dependencies, gates and next actions.
- [Migration overview](migration-overview.md) — feature coverage summary; historical evidence remains in the ledger.

Consequential choices are recorded separately in the [decision log](../decisions/README.md).
Operational commands belong in [operations](../operations/README.md), while exact configuration,
API contracts, and table ownership belong in [reference](../reference/README.md).
