---
title: Product Map
description: User-facing route inventory and domain documentation for Biwenger Stats.
audience:
  - user
  - newcomer
  - contributor
  - maintainer
  - agent
status: active
---

# Product map

Product documentation follows user domains rather than individual components. Each note connects
behavior to its page entries, internal APIs, services, data access, and tests.

## Domains

- [Dashboard](dashboard.md) — home and personalized analytics.
- [Players and teams](players-and-teams.md) — discovery and profiles.
- [Competition and analytics](competition-and-analytics.md) — rounds, schedule, matches, standings,
  and comparisons.
- [Squad and market](squad-and-market.md) — lineup management, listings, offers, and finance.
- [Predictions and tournaments](predictions-and-tournaments.md) — predictions, playoffs, and cups.
- [Assistant](assistant.md) — conversational analytics over local league context.
- [Hoopgrid](hoopgrid.md) — daily trivia, rarity, and internal inspection views.
- [Accounts and settings](accounts-and-settings.md) — login, manager profiles, and preferences.

## Page inventory

The App Router currently exposes 23 page entry files:

| Domain                      | Routes                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| Home and dashboard          | `/`, `/dashboard`                                                |
| Players and teams           | `/players`, `/player/[id]`, `/team/[id]`                         |
| Competition                 | `/rounds`, `/schedule`, `/matches`, `/standings`, `/compare`     |
| Squad and market            | `/lineup`, `/market`                                             |
| Predictions and tournaments | `/predictions`, `/playoffs`, `/tournaments`, `/tournaments/[id]` |
| Assistant                   | `/assistant`                                                     |
| Hoopgrid                    | `/hoopgrid`, `/hoopgrid-cheatsheet`, `/test-hoopgrid`            |
| Accounts                    | `/login`, `/settings`, `/user/[id]`                              |

`/test-hoopgrid` is an internal diagnostic page, not a supported end-user destination. All routes
except the login flow are intended for authenticated use under the current middleware policy.

The route source is [`src/app`](../../src/app). Endpoint-level details live in the
[internal API reference](../reference/internal-api.md).
