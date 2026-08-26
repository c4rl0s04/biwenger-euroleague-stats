---
title: Internal API Reference
description: Inventory of Next.js route handlers grouped by product domain.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Internal API reference

The repository contains 75 route-handler files under [`src/app/api`](../../src/app/api). This is an
inventory, not a promise that all endpoints share identical authentication, parameters, cache
headers, or response envelopes. The route file and its tests remain the exact contract.

## Authentication and assistant

| Methods     | Route                               |
| ----------- | ----------------------------------- |
| GET, POST   | `/api/auth/[...nextauth]`           |
| POST        | `/api/assistant`                    |
| GET, POST   | `/api/assistant/conversations`      |
| GET, DELETE | `/api/assistant/conversations/[id]` |

## Dashboard and general discovery

All routes below use GET.

| Routes                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ |
| `/api/landing-stats`, `/api/news`, `/api/search`, `/api/league-average`                                                  |
| `/api/dashboard/birthdays`, `/api/dashboard/captain-stats`, `/api/dashboard/captain-suggest`                             |
| `/api/dashboard/home-away`, `/api/dashboard/ideal-lineup`, `/api/dashboard/leader-gap`                                   |
| `/api/dashboard/market-opportunities`, `/api/dashboard/mvps`, `/api/dashboard/next-round`                                |
| `/api/dashboard/recent-activity`, `/api/dashboard/rising-stars`, `/api/dashboard/top-form`, `/api/dashboard/top-players` |

## Players, teams, users, and comparison

| Methods   | Routes                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| GET       | `/api/player/rounds`, `/api/player/squad`, `/api/player/stats`, `/api/player/streaks` |
| GET       | `/api/players/[id]/stats`, `/api/team/[id]`, `/api/stats/leaders`, `/api/users`       |
| GET       | `/api/compare/data`, `/api/compare/data/lite`                                         |
| GET, POST | `/api/users/lineup`                                                                   |
| POST      | `/api/user/change-password`, `/api/user/link-biwenger`                                |

## Rounds and standings

All routes below use GET.

| Routes                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- |
| `/api/rounds/all-history`, `/api/rounds/history`, `/api/rounds/leaderboard`                                         |
| `/api/rounds/lineup`, `/api/rounds/lineup-stats`, `/api/rounds/list`, `/api/rounds/standings`, `/api/rounds/stats`  |
| `/api/standings/advanced`, `/api/standings/analytics`, `/api/standings/full`                                        |
| `/api/standings/bottlers`, `/api/standings/captains`, `/api/standings/efficiency`                                   |
| `/api/standings/heartbreakers`, `/api/standings/initial-squad-stats`, `/api/standings/jinx`                         |
| `/api/standings/league-comparison`, `/api/standings/league-totals`, `/api/standings/no-glory`                       |
| `/api/standings/placements`, `/api/standings/points-progression`, `/api/standings/round-winners`                    |
| `/api/standings/streaks`, `/api/standings/theoretical`, `/api/standings/value-ranking`, `/api/standings/volatility` |

## Official game detail

| Method | Route                            | Optional filters                 |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/api/matches/[id]/play-by-play` | `period`, `teamCode`, `playerId` |
| GET    | `/api/matches/[id]/shots`        | `period`, `teamCode`, `playerId` |

Both endpoints resolve the server season, read PostgreSQL only, return official sequence order, and
use a 15-second cache while live and a one-hour cache after finalization.

## Market

| Methods | Routes                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/api/market`, `/api/market/duels/details`, `/api/market/stats`, `/api/market/stats/value-details`, `/api/market/transfers`, `/api/market/trends` |
| POST    | `/api/market/sell`, `/api/market/sell-all`, `/api/market/offers/accept`, `/api/market/offers/reject`                                              |
| DELETE  | `/api/market/remove`                                                                                                                              |

Market mutation endpoints can change external Biwenger state and require a user-specific provider
token in addition to normal application authorization.

## Hoopgrid

| Methods | Route                                       |
| ------- | ------------------------------------------- |
| GET     | `/api/hoopgrid/today`, `/api/hoopgrid/list` |
| POST    | `/api/hoopgrid/guess`                       |

## Contract conventions

Many routes validate inputs with [`validation.ts`](../../src/lib/utils/validation.ts), delegate to a
service, and return helpers from [`response.ts`](../../src/lib/utils/response.ts). Do not infer that
convention for a route without inspection. API routes are excluded from page middleware, so
authentication is also a route-level responsibility.

When changing a URL, method, parameter, status, cache header, or response shape, update the route
tests and this inventory in the same pull request.
