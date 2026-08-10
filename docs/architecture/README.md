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

- [System overview](system-overview.md) — runtime responsibilities and repository map.
- [Application layers](application-layers.md) — browser-to-database request flow and boundaries.
- [Data and sync](data-and-sync.md) — local-first data ingestion and write safety.
- [Authentication and security](authentication-and-security.md) — page protection, credentials, and
  API responsibilities.

Consequential choices are recorded separately in the [decision log](../decisions/README.md).
Operational commands belong in [operations](../operations/README.md), while exact configuration and
API contracts belong in [reference](../reference/README.md).
