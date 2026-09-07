---
title: Batch 001 worker report
description: Worker-owned pilot handoff.
audience:
  - agent
  - maintainer
status: active
---

# Standings pilot worker report

## Identity

- Batch: 001-standings
- Status: IMPLEMENTING
- Branch and absolute worktree: `refactor/standings-read-completion`, `/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-standings-read-completion`
- Exact starting SHA: 38bf2de48fc1c73165389536ef7ecbed2307ebad
- Source commit SHAs: (will record at the end)
- Instruction-pack branch/commit: `docs/migration-worker-playbook`
- Working tree clean: No (in progress)

## Inventory before edits

### Pages (UI)

- `src/app/(app)/standings/page.js`
  - **Type**: Server Component
  - **Dynamic**: `export const dynamic = 'force-dynamic'`
  - **Service**: `getFullStandings()`, `getLeagueOverview()`
  - **Screen Consumer**: `<MobileStandingsScreen>` / `<DesktopStandingsScreen>`
- `src/app/(app)/standings/[section]/page.tsx`
  - **Type**: Server Component (Dynamic Route)
  - **Params**: `section` (progression, rounds, draft, form, performance, alternatives, curiosities, captains)
  - **Services**: `fetchPointsProgression`, `fetchRoundWinners`, `fetchInitialSquadAnalytics`, `fetchInitialSquadStats`, `fetchHeatCheckStats`, `fetchStreakStats`, `fetchReliabilityStats`, `fetchEfficiencyStats`, `fetchAllPlayAllStats`, `fetchHeartbreakerStats`, `fetchDetailedCaptainStats`.
  - **Screen Consumer**: `<MobileDetailScaffold>`, `<MobileRecordList>`

### API Routes (`src/app/api/standings/`)

**Common Details (unless specified otherwise)**:

- **Identity Source**: None (Public League Statistics)
- **Error Envelope**: `{ success: false, error: 'Internal Server Error' }` (Status 500)
- **Error Headers**: `Cache-Control: private, no-store, max-age=0, must-revalidate`
- **Server Cache Policy**: Uncached (passthrough to DB), except `all-play-all` which uses `cached()` helper.

| Route                           | Dynamic / Reval       | Input Quirks                              | Service -> Query/Table                                                                         | Exact Success Headers                                           | Success Envelope                            |
| ------------------------------- | --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `/advanced/route.ts`            | Default (Unspecified) | `?type=` param (heat-check, hunter, etc.) | Routes to 12+ `fetch*Stats` functions based on type.                                           | None (Next.js default JSON headers)                             | `{ success: true, data }`                   |
| `/analytics/route.ts`           | `force-dynamic`       | None                                      | `fetchInitialSquadAnalytics` -> `getInitialSquadActualPerformance`                             | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/bottlers/route.ts`            | `force-dynamic`       | None                                      | `fetchBottlerStats` -> `getBottlerStats`                                                       | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/captains/route.ts`            | Default (Unspecified) | None                                      | `fetchDetailedCaptainStats` -> `getDetailedCaptainStats`                                       | `Cache-Control: public, max-age=0, stale-while-revalidate=60`   | `{ success: true, data: { stats: [...] } }` |
| `/efficiency/route.ts`          | `force-dynamic`       | None                                      | `fetchEfficiencyStats` -> `getEfficiencyStats`                                                 | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/full/route.ts`                | `force-dynamic`       | Parsed via `parseStandingsSearchParams`   | `getFullStandings` -> `queryFullStandings`                                                     | `Cache-Control: public, max-age=60, stale-while-revalidate=60`  | `{ success: true, data }`                   |
| `/heartbreakers/route.ts`       | `force-dynamic`       | None                                      | `fetchHeartbreakerStats` -> `getHeartbreakerStats`                                             | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/initial-squad-stats/route.ts` | `force-dynamic`       | None                                      | `fetchInitialSquadStats` -> `getBestInitialSquadPlayer`, `getInitialSquadRetainedPoints`, etc. | `Cache-Control: public, max-age=300, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/jinx/route.ts`                | `force-dynamic`       | None                                      | `fetchJinxStats` -> `getJinxStats`                                                             | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/league-comparison/route.ts`   | `force-dynamic`       | None                                      | `fetchLeagueComparisonStats` -> `getLeagueComparisonStats`                                     | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/league-totals/route.ts`       | `force-dynamic`       | None                                      | `getLeagueOverview` -> `queryLeagueOverview`                                                   | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/no-glory/route.ts`            | `force-dynamic`       | None                                      | `fetchNoGloryStats` -> `getNoGloryStats`                                                       | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/placements/route.ts`          | `force-dynamic`       | None                                      | `fetchPlacementStats` -> `getPlacementStats`                                                   | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/points-progression/route.ts`  | `force-dynamic`       | `?limit=10` (default 10)                  | `fetchPointsProgression` -> `getPointsProgression`                                             | `Cache-Control: public, max-age=60, stale-while-revalidate=60`  | `{ success: true, data }`                   |
| `/round-winners/route.ts`       | `force-dynamic`       | `?limit=15` (default 15)                  | `fetchRoundWinners` -> `getRoundWinners`                                                       | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/streaks/route.ts`             | `force-dynamic`       | None                                      | `fetchStreakStats` -> `getStreakStats`                                                         | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/theoretical/route.ts`         | `force-dynamic`       | None                                      | `fetchTheoreticalStandings` -> computes gap/efficiency                                         | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/value-ranking/route.ts`       | `force-dynamic`       | None                                      | `fetchValueRanking` -> `queryValueRanking`                                                     | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |
| `/volatility/route.ts`          | `force-dynamic`       | None                                      | `fetchVolatilityStats` -> `getVolatilityStats`                                                 | `Cache-Control: public, max-age=900, stale-while-revalidate=60` | `{ success: true, data }`                   |

## Implementation

Bounded services/models/components created; query ownership; moved/deleted files;
retained adapters and their consumers; deliberate cross-feature contracts.
List preserved formula and presentation quirks and any decisions requiring review.

## Verification

| Command                            | Baseline result | Candidate result |
| ---------------------------------- | --------------- | ---------------- |
| Typecheck                          | Pass            | Not run          |
| Architecture                       | Pass            | Not run          |
| Working and full-range diff checks | Not run         | Not run          |

## Risks and handoff

Blockers, unverified visuals/platforms, remaining scope, suggested focused test commands.
Confirm no prohibited changes, external operations or other batch started.
Final status: IMPLEMENTING
