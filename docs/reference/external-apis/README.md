---
title: External API Reference
description: Provider map for data ingestion and AI generation boundaries.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# External API reference

- [Biwenger](biwenger.md) supplies private fantasy league, user, market, lineup, tournament, and
  scoring data and accepts authenticated market actions.
- [EuroLeague](euroleague.md) supplies official team, schedule, game header, and box-score data.
- The [assistant product note](../../product/assistant.md) describes optional Groq/OpenAI generation;
  it is a runtime feature rather than part of the ingestion pipeline.

Provider endpoints are not public contracts controlled by this repository. Client modules and sync
tests are the implementation source of truth. Never copy real authorization headers or private
league responses into documentation.
