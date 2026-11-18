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

- [How it works](system-overview.md) — data flow, standings reads, and personal bids.
- [Application layers](application-layers.md) — browser-to-database request flow and boundaries.
- [UI component layering target](ui-component-layers.md) — agreed UI composition and reuse direction.
- [Design system](../product/design-system.md) — current tokens, primitives, and compositions.
- [Data and sync](data-and-sync.md) — local-first data ingestion, persistence ownership, and write safety.
- [Authentication and security](authentication-and-security.md) — page protection, credentials, database access, and API responsibilities.

See [GitHub Issues](https://github.com/c4rl0s04/biwenger-euroleague-stats/issues) for open work
and [migration history](../migration/README.md) for rollout evidence.

Consequential choices are recorded separately in the [decision log](../decisions/README.md).
Operational commands belong in [operations](../operations/README.md), while exact configuration,
API contracts, and table ownership belong in [reference](../reference/README.md).
