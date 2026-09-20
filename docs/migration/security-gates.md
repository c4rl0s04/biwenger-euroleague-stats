---
title: Deferred migration security gates
description: Areas not authorized by the ordinary read migration queue.
audience:
  - agent
  - maintainer
status: active
---

# Separate security gates

These are not worker assignments. No implementation is authorized here.

- Hoopgrid: challenge creation in GET and mixed read/write/private-response behavior.
- Private Lineup and Market operations: provider mutations and authorization review.
- Accounts and Settings: authentication, linking, encryption and credential storage/rotation.
  The plaintext fallback was already removed; do not restore it from historical plans.
- Assistant: privacy, conversational data and provider orchestration.

The coordinator must obtain an explicit separate scope and safety plan before dispatch.
Do not absorb these into public read batches or change security behavior as cleanup.
Scope inventory and implementation gates are tracked in [Tasks 12–21](tracker.md).
Return to the [migration entry point](README.md); historical worker IDs are not dispatch authority.
