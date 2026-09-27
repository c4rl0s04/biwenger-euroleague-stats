---
title: Task 23 Application Shell Migration
description: Architectural migration of persistent application chrome to src/components/shell.
audience:
  - maintainer
  - agent
status: active
---

# Task 23 — Application Shell Migration

Base: `89267368`.
Branch: `refactor/application-shell`.
State: Implemented and locally verified; merge remains gated on the published exact-head checks.

## Scope and purpose

Task 23 represents the **first production adoption of the new UI foundation** (`UI-00`, `UI-01A`, `UI-01T`, `UI-01B`, `UI-01H`).

Its purpose is to replace the legacy global application chrome under `src/components/layout/` with the documented target shell architecture under `src/components/shell/` while strictly preserving all routing, domain, authentication, navigation, accessibility, PWA, and data contracts.

## Architecture and components

The shell is structured into four explicit responsibility areas:

```text
src/components/shell/
├── shared/            # Shared primitives, providers, context, navigation model
├── desktop/           # Desktop shell layout, sidebar, header, footer
├── mobile/            # Phone/PWA shell layout, bottom nav, More menu dialog
└── integrations/      # Feature capability placements (Search, Season, Account)
```

### 1. Shared core (`src/components/shell/shared/`)

- **`navigation.ts`**: Canonical single source of truth for navigation destinations (16 items), mobile primary items (Inicio, Horario, Dashboard, Clasificación), `isNavigationItemActive` route matching, and mobile navigation categories.
- **`SectionContext.tsx`**: Typed section registration provider with DOM-ordered anchors (`requestAnimationFrame`) for dynamic in-page navigation.
- **`NavigationFeedback.tsx`**: Route transition progress bar and screen-reader polite status announcements (`role="status"`, `aria-live="polite"`).
- **`AppBrand.tsx`**: Accessible brand wordmark and logo via `next/image` with link to `/`.
- **`AppBackground.tsx`**: Quiet sports analytics canvas using semantic tokens (`--surface-app`, `--effect-shell-ambient-primary`, `--effect-shell-ambient-subtle`) without component-local `dark:` overrides.
- **`AppMain.tsx`**: Semantic `<main id="main-content" tabIndex={-1} className="app-main-content">` landmark.
- **`AppProviders.tsx`**: Replaces `ClientWrapper.js`, composing `UserProvider`, `SeasonProvider`, `ErrorBoundary`, and `CommandPalette` with strongly typed props.

### 2. Desktop shell (`src/components/shell/desktop/`)

- **`Sidebar.tsx`**: Desktop navigation with collapsible drawer using `<IconButton>` primitive, auto-collapse on tablet viewports (768px-1023px), and dynamic section sub-lists.
- **`AppHeader.tsx`**: Desktop header composing brand, global search, settings link, season selector, and account menu. Removed fake notifications UI (bell icon + pulsing dot).
- **`AppFooter.tsx`**: Semantic footer with valid GitHub repo link, clean navigation links, and copyright. Excludes fake interactive spans.
- **`DesktopShell.tsx`**: Orchestrates header, sidebar, news ticker (`@/features/news/public`), main content, and footer.

### 3. Mobile shell (`src/components/shell/mobile/`)

- **`MobileNavigation.tsx`**: Fixed bottom navigation bar with 4 primary destinations, active state styling, pending navigation spinner, stable `useCallback` for `onClose`, and "Más" button.
- **`MobileMoreMenu.tsx`**: Accessible dialog (`role="dialog"`, `aria-modal="true"`) with `<IconButton>` close button, Tab / Shift+Tab focus trap, Escape handling, body scroll lock, focus restoration, global search, season selector, and categorized navigation links.
- **`MobileShell.tsx`**: Orchestrates main content frame and mobile bottom navigation.

### 4. Integrations (`src/components/shell/integrations/`)

- **`AccountMenu.tsx`**: Replaces `UserSelector.js`. Cleaned up debug logging, preserved NextAuth `signOut` flow, and added client mount guard (`isClient`) to prevent React #418 hydration mismatches.
- **`GlobalSearch.tsx`**: Replaces `SearchDropdown.js`. Features 300ms debounce, keyboard navigation (ArrowUp/Down/Enter/Escape), type badges, and navigation feedback.
- **`SeasonSelector.tsx`**: Accessible trigger and dropdown using `useSeason()` context.
- **`CommandPalette.tsx`**: Replaces `src/components/ui/CommandPalette.js`. Global Cmd+K / Ctrl+K palette styled with semantic foundation tokens.

### 5. Root presentation dispatcher (`src/components/shell/AppShell.tsx`)

- Renders accessible skip-to-content link pointing to `#main-content`.
- Dispatches to `<MobileShell>` when `presentationMode === 'phone'` and `<DesktopShell>` otherwise.
- Sets root `data-presentation` attribute.

## Cleanups and deletions

### Obsolete files deleted

- `src/components/layout/AppShell.js`
- `src/components/layout/TopHeader.js`
- `src/components/layout/Sidebar.js`
- `src/components/layout/MobileNavigation.js`
- `src/components/layout/NavigationFeedback.js`
- `src/components/layout/navigation.js`
- `src/components/layout/navigation.test.ts`
- `src/components/layout/SearchDropdown.js`
- `src/components/layout/SeasonSelector.js`
- `src/components/layout/SettingsDropdown.js`
- `src/components/layout/Navbar.js`
- `src/components/layout/ClientWrapper.js`
- `src/components/layout/SectionContext.js`
- `src/components/user/UserSelector.js`
- `src/components/user/index.js` (and directory `src/components/user` removed)
- `src/components/ui/CommandPalette.js`

### Retained compatibility and removal conditions

The following inventory lists direct production importers, including named imports through barrels.
Tests are excluded. Nothing here authorizes a feature presentation migration.

#### Section

Retained file: `src/components/layout/Section.js`.

- `src/components/layout/index.js`
- `src/components/lineup/LineupClient.js`
- `src/features/accounts/screens/DesktopSettingsScreen.js`
- `src/features/assistant/screens/DesktopAssistantScreen.tsx`
- `src/features/compare/components/DesktopCompareScreen.js`
- `src/features/dashboard/screens/DesktopDashboardScreen.tsx`
- `src/features/managers/components/ManagerProfileClient.js`
- `src/features/market/catalogue/components/MarketListingsSection.tsx`
- `src/features/market/screens/components/MarketPageClient.tsx`
- `src/features/matches/components/desktop/MatchesClient.js`
- `src/features/players/components/desktop/catalogue/PlayersDiscovery.js`
- `src/features/players/components/desktop/profile/PlayerProfileClient.js`
- `src/features/playoffs/components/PlayoffClient.tsx`
- `src/features/predictions/components/PredictionsClient.js`
- `src/features/rounds/components/desktop/RoundsPageClient.js`
- `src/features/schedule/components/DesktopScheduleScreen.js`
- `src/features/standings/components/DesktopStandingsScreen.js`
- `src/features/teams/components/desktop/TeamProfileClient.tsx`
- `src/features/tournaments/components/screens/DesktopTournamentDetailScreen.jsx`
- `src/features/tournaments/components/screens/DesktopTournamentsScreen.tsx`

Reason: legacy feature section registration still uses the layout entrypoint. Remove Section and its layout/index.js re-export when these consumers migrate to an agreed UI-01C composition.

#### ThemeBackground

Retained file: `src/components/ui/ThemeBackground.js`.

- `src/components/ui/index.js`
- `src/features/managers/components/ManagerProfileScreen.tsx`
- `src/features/players/components/PlayerProfileScreen.tsx`
- `src/features/teams/components/TeamProfileScreen.tsx`

Reason: profile screens still own legacy theme backgrounds. Remove after each listed profile migrates its canvas treatment.

#### Card

Retained file: `src/components/ui/Card.js`.

- `src/components/ui/index.js`
- `src/features/dashboard/components/cards/BirthdayCard.js`
- `src/features/dashboard/components/cards/CaptainStatsCard.js`
- `src/features/dashboard/components/cards/CaptainSuggestCard.js`
- `src/features/dashboard/components/cards/HomeAwayCard.js`
- `src/features/dashboard/components/cards/IdealLineupCard.js`
- `src/features/dashboard/components/cards/LeaderGapCard.js`
- `src/features/dashboard/components/cards/LeagueComparisonCard.js`
- `src/features/dashboard/components/cards/MarketActivityCard.js`
- `src/features/dashboard/components/cards/MarketOpportunitiesCard.js`
- `src/features/dashboard/components/cards/MySeasonCard.js`
- `src/features/dashboard/components/cards/RecentRoundsCard.js`
- `src/features/dashboard/components/cards/RisingStarsCard.js`
- `src/features/dashboard/components/cards/SquadValueCard.js`
- `src/features/dashboard/components/cards/StatsLeadersCard.js`
- `src/features/dashboard/components/cards/StreakCard.js`
- `src/features/dashboard/components/cards/TopFormCard.js`
- `src/features/dashboard/components/cards/TopPlayersCard.js`
- `src/features/dashboard/components/cards/WeekMVPsCard.js`
- `src/features/predictions/components/cards/BestAverageCard.js`
- `src/features/predictions/components/cards/BlankedCard.js`
- `src/features/predictions/components/cards/ClutchCard.js`
- `src/features/predictions/components/cards/ParticipationCard.js`
- `src/features/predictions/components/cards/Perfect10Card.js`
- `src/features/predictions/components/cards/PerformanceCard.js`
- `src/features/predictions/components/cards/PredictableTeamsCard.js`
- `src/features/predictions/components/cards/VictoriasCard.js`
- `src/features/predictions/components/tables/HistoryTable.js`
- `src/features/standings/components/AllPlayAllCard.js`
- `src/features/standings/components/BestDraftPlayerCard.js`
- `src/features/standings/components/BottlerCard.js`
- `src/features/standings/components/DominanceCard.js`
- `src/features/standings/components/DraftFidelityCard.js`
- `src/features/standings/components/EfficiencyCard.js`
- `src/features/standings/components/FloorCeilingCard.js`
- `src/features/standings/components/HeartbreakersCard.js`
- `src/features/standings/components/HeatCheckCard.js`
- `src/features/standings/components/InitialSquadAnalysisCard.js`
- `src/features/standings/components/InitialSquadListCard.js`
- `src/features/standings/components/InitialSquadLoyaltyCard.js`
- `src/features/standings/components/InitialSquadPotentialCard.js`
- `src/features/standings/components/InitialSquadRegretCard.js`
- `src/features/standings/components/JinxCard.js`
- `src/features/standings/components/LeaguePerformanceCard.js`
- `src/features/standings/components/LeagueStatsCard.js`
- `src/features/standings/components/NoGloryCard.js`
- `src/features/standings/components/PlacementStatsCard.js`
- `src/features/standings/components/PointDistributionCard.js`
- `src/features/standings/components/PointsProgressionCard.js`
- `src/features/standings/components/PositionEvolutionCard.js`
- `src/features/standings/components/ReliabilityCard.js`
- `src/features/standings/components/RivalryMatrixCard.js`
- `src/features/standings/components/RollingAverageCard.js`
- `src/features/standings/components/RoundHeatmapCard.js`
- `src/features/standings/components/RoundPointsProgressionCard.js`
- `src/features/standings/components/RoundWinnersCard.js`
- `src/features/standings/components/StreaksCard.js`
- `src/features/standings/components/TheHunterCard.js`
- `src/features/standings/components/TheoreticalGapCard.js`
- `src/features/standings/components/VolatilityCard.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### StandardCard

Retained file: `src/components/ui/card-variants/StandardCard.js`.

- `src/components/ui/Card.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### GlassCard

Retained file: `src/components/ui/card-variants/GlassCard.js`.

- `src/components/ui/Card.js`
- `src/components/ui/index.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### MeshCard

Retained file: `src/components/ui/card-variants/MeshCard.js`.

- `src/components/ui/Card.js`
- `src/components/ui/index.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### NeoCard

Retained file: `src/components/ui/card-variants/NeoCard.js`.

- `src/components/ui/Card.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### ElegantCard

Retained file: `src/components/ui/card-variants/ElegantCard.js`.

- `src/components/lineup/LineupSquadAnalysis.js`
- `src/components/schedule/AutoAlignActionRow.js`
- `src/components/ui/Card.js`
- `src/components/ui/StatsTable.js`
- `src/components/ui/index.js`
- `src/features/accounts/screens/DesktopSettingsScreen.js`
- `src/features/compare/components/HeadToHeadCard.js`
- `src/features/dashboard/components/cards/NextMatchesCard.js`
- `src/features/home/components/DesktopHome.jsx`
- `src/features/managers/components/LeagueDominanceCard.js`
- `src/features/managers/components/ManagerIdentityCard.js`
- `src/features/managers/components/ManagerProfileClient.js`
- `src/features/managers/components/MarketActivityCard.js`
- `src/features/managers/components/PointsEvolutionChart.js`
- `src/features/managers/components/SeasonRecordsCard.js`
- `src/features/managers/components/UserSquadAnalysisCard.js`
- `src/features/managers/components/UserTopContributorsCard.js`
- `src/features/managers/components/UserTournamentsCard.js`
- `src/features/managers/components/UserTrophyCabinetCard.js`
- `src/features/market/analytics/components/cards/BiddingDuelDetailsCard.tsx`
- `src/features/market/analytics/components/cards/BiddingDuelsMatrixCard.tsx`
- `src/features/market/analytics/components/cards/BiggestDominanceCard.js`
- `src/features/market/analytics/components/cards/HottestRivalryCard.js`
- `src/features/market/analytics/components/cards/MarketPodiumCard.js`
- `src/features/market/analytics/components/cards/MarketStatCard.js`
- `src/features/market/analytics/components/cards/PositionAnalysisGrid.js`
- `src/features/market/catalogue/components/LiveMarketTable.js`
- `src/features/market/catalogue/components/MarketListingsSection.tsx`
- `src/features/market/screens/components/MarketPageClient.tsx`
- `src/features/market/trends/components/MarketKPIs.js`
- `src/features/market/trends/components/MarketTrendsChart.tsx`
- `src/features/players/components/desktop/catalogue/PlayerFilters.js`
- `src/features/players/components/desktop/catalogue/PlayerStatsSection.js`
- `src/features/players/components/desktop/catalogue/SquadDistributionPieCard.js`
- `src/features/players/components/desktop/catalogue/SquadPositionBarCard.js`
- `src/features/players/components/desktop/profile/PlayerAdvancedStatsCard.js`
- `src/features/players/components/desktop/profile/PlayerHistoryCard.js`
- `src/features/players/components/desktop/profile/PlayerIdentityCard.js`
- `src/features/players/components/desktop/profile/PlayerMarketCard.js`
- `src/features/players/components/desktop/profile/PlayerNextMatchCard.js`
- `src/features/players/components/desktop/profile/PlayerOwnershipCard.js`
- `src/features/players/components/desktop/profile/PlayerPointsGraph.js`
- `src/features/players/components/desktop/profile/PlayerPriceHistoryCard.js`
- `src/features/players/components/desktop/profile/PlayerSplitsCard.js`
- `src/features/players/components/desktop/profile/PlayerStatsCard.js`
- `src/features/playoffs/components/PlayoffClient.tsx`
- `src/features/rounds/components/desktop/RoundStandings.js`
- `src/features/rounds/components/desktop/RoundsPageClient.js`
- `src/features/rounds/components/desktop/stats/CoachRatingCard.js`
- `src/features/rounds/components/desktop/stats/GradaCard.js`
- `src/features/rounds/components/desktop/stats/ScoreOverviewCard.js`
- `src/features/rounds/components/desktop/stats/history/PerformanceChart.js`
- `src/features/rounds/components/desktop/stats/history/RecordsGrid.js`
- `src/features/season-review/screens/DesktopSeasonReviewScreen.tsx`
- `src/features/teams/components/desktop/TeamIdentityCard.tsx`
- `src/features/teams/components/desktop/TeamMatchesCard.tsx`
- `src/features/teams/components/desktop/TeamRosterCard.tsx`
- `src/features/tournaments/components/TournamentFixtures.js`
- `src/features/tournaments/components/TournamentRow.js`
- `src/features/tournaments/components/screens/DesktopTournamentDetailScreen.jsx`
- `src/features/tournaments/components/stats/HallOfFame.js`
- `src/features/tournaments/components/stats/RecordsSection.js`

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

#### CardThemeContext

Retained file: `src/contexts/CardThemeContext.js`.

- `src/app/layout.js`
- `src/components/ui/Card.js`
- `src/components/ui/ThemeBackground.js`
- `src/components/ui/ThemeSwitcher.js`

Reason: the root provider supplies the legacy static Card theme. Remove only after Card, ThemeBackground and ThemeSwitcher stop consuming it; then remove the root provider in the same migration.

#### ThemeSwitcher

Retained file: `src/components/ui/ThemeSwitcher.js`.

No current production importers. Retained as part of the unchanged legacy theme family; remove in its coordinated cleanup rather than selectively changing that compatibility API here.

Reason: unmigrated presentation still relies on the legacy Card/theme family and its src/components/ui/index.js exports. Remove each variant/export only when direct consumers and legacy Card dispatch no longer reference it; remove Card once all its listed consumers migrate.

## Deliberate ownership and styling decisions

- **MobileHeaderActions → shell (temporary Option A):** `src/components/mobile/MobileHeaderActions.tsx` remains a page-level composition importing `GlobalSearch` and `NavigationLink` from shell. It places the existing global search/navigation capability inside mobile page headers. Extracting a shared capability now would broaden Task 23. Revisit this exact edge during UI-01C/UI-02 when a second capability API is justified. MobileScreen, MobileScreenHeader, MobileBackHeader, MobileMetricGrid and MobileSectionHeading remain outside shell. The legacy UserAvatar component adapter remains in MobileHeaderActions until that page-level composition is migrated; user state now comes directly from the owning hook contract.
- **Typed boundaries:** SeasonContext and UserContext own exported JSDoc contracts; useClientUser exposes the owning user contract plus hydration flags. Shell imports or infers these contracts without duplicated interfaces or provider/hook assertions. Runtime selection, cookies, session synchronization and season resolution are unchanged.
- **Canonical semantics:** AppBackground consumes complete HSL colors and semantic ambient effects. Brand glow, progress accent, modal overlay and navigation/sheet elevation are shell semantic roles, with deliberate light mappings. Generic utilities such as bg-card/text-primary are valid canonical mappings in the Tailwind bridge; their spelling does not imply a dependency on the legacy CSS aliases.
- **Global CSS retained deliberately:** safe areas, PWA clearance, navigation-progress placement, responsive main clearance, and reduced-motion rules stay global. Bottom-navigation and More-menu selectors stay in globals.css during this migration, now consuming semantic shell roles. The unused mobile-sheet-close rule was removed. Existing public install/offline and PWA-promotion styles remain compatibility presentation outside this shell cleanup, as do feature mobile-native.css rules and domain/category colors.
- **Hydration/accessibility:** AccountMenu retains its isClient guard. The More close callback is stable, with browser checks for initial focus, Tab/Shift+Tab wrapping, Escape, focus restoration, pending navigation, safe areas, and overflow. CSS browser assertions check actual canvas/content colors and the progress gradient in dark and explicit light; unit coverage checks compact avatar fallbacks.

## Visual acceptance

The pre-hardening CI failure on Matches exposed old full-page chrome baselines. Approved shell changes include the new header controls, semantic sidebar, readable avatar initial, removal of fake notification/social/legal controls, and the shorter semantic footer. Feature data, headings, route content and map remain owned by their existing features. Only the desktop-1440 Matches and Team references were updated, separately for Linux and macOS, after inspecting the old and new captures. Linux captures used the pinned Playwright 1.58.2 ARM64 image against the freshly built disposable fixture app; macOS captures used the repository runner. The shorter footer accounts for the full-page height change. Team also reflects the existing main fix `9a3fe855`: missing participation produces a neutral `?` rather than a red DNP `-`; the fixture, Team implementation and player-form query are unchanged by this PR. Phone and all other references remain untouched. Normal macOS comparison passed afterward without snapshot updates; exact Linux comparison remains enforced by CI.

## Verification evidence

- Latest reconciled main: `89267368d7e61c4b11c9e74003f3124f9c11d1a0`. The initial rebase onto `f74f22ab` was clean. Two subsequent clean merges preserve the new `fa48d5a2` sync price-history fix and `89267368` manual finance workflow/docs unchanged, together with Tasks 16–18 and earlier documentation updates.
- Runtime/test implementation: `0596fb591d8f922c4fe5ab77a655ff2b1d01ed12`.
- Reviewed visual references: `d298083037bee6edc733ab7836a83cf54b08e801`. Final integrated implementation: `7c3fd5fdc9b643dcd9a90140dfc128af2da97707`.
- Exact implementation synthetic merge candidate: `ffe0bbd5b3bce36825871ededcb94e0f21737d22` (main `89267368`, PR head `8bb7e09b`). Its tree `06786421f9e3ddb09994cbebdee811ac83c16bf1` is identical to final integrated implementation `7c3fd5fd`; the latter explicitly merges the finance workflow parent into the branch.
- [Implementation candidate CI and current result](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36317677088). [Final publication checks](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/49/checks) also validate the subsequent evidence-only documentation commit. The PR verification record identifies that published head and synthetic merge SHA after publication; it is intentionally separate from the immutable implementation SHA to avoid a self-referential commit hash. Require Format Check, Test & Build, Browser contracts and visual regression, and Vercel success before merge. Deployment Smoke Check is conditionally skipped by its workflow, not a passing deployment test.

### Local commands and results

| Command                                                                               | Result                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run skills:check`                                                                | PASS — 6 repository skills                                                                                  |
| `npm run architecture:check`                                                          | PASS — 1,105 modules, 99 entrypoints, no violations                                                         |
| `npm run docs:check`                                                                  | PASS — 125 vault notes                                                                                      |
| `npm run typecheck`                                                                   | PASS                                                                                                        |
| `npm run test:run -- --maxWorkers=2`                                                  | PASS — 2,852 tests passed / 6 skipped; 347 files passed / 3 skipped                                         |
| `npm run lint`                                                                        | PASS — 0 errors, 25 warnings; includes the existing More-menu ref-cleanup warning and legacy image warnings |
| `SKIP_DB=true npm run build`                                                          | PASS — production build, 52 static pages generated                                                          |
| `npm run db:audit:schema:metadata`                                                    | PASS — 37 source/snapshot tables; no table, column or unique-constraint drift                               |
| `npx --no-install drizzle-kit check`                                                  | PASS                                                                                                        |
| `npm run verify`                                                                      | PASS — runs all checks above plus diff check                                                                |
| `npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"` then matching `--check` | PASS                                                                                                        |
| `git diff --check`                                                                    | PASS                                                                                                        |
| `npx --no-install vitest run src/components/shell src/lib/theme --maxWorkers=2`       | PASS — 49 tests across 9 files                                                                              |

The full checks ran on the latest integrated application source. The finance workflow/documentation merge does not change that source; docs checks were repeated afterward. Publication CI revalidates the exact final tree, including this evidence-only update. All 18 changed domain/API files outside the intentional News boundary test and user-hook contract were independently compared with formatted main source and proved formatting-only.

### Browser results

The disposable runner executed `pwa-responsive.spec.ts`, `application-theme.spec.ts`, `home-architecture.spec.ts` and `feature-screens.spec.ts` together on iPhone 13, tablet-768 and desktop-1440: **38 passed, 3 expected project-specific skips, 1 stale desktop Matches reference failure**. After visual inspection and the bounded reference update, a normal `npm run test:e2e:local -- tests/e2e/feature-screens.spec.ts --project=desktop-1440` rerun **passed 1/1**, comparing both Matches and Team without regeneration. Thus all 39 applicable cases passed across the initial run plus the targeted correction run; this is not represented as a single all-green initial run.

Desktop and phone explicit-light smoke passed. Dark/light persistence, system changes, cross-tab updates, storage failures, SSR/pre-hydration behavior, Surface/Card neutrality, actual shell color/gradient resolution, safe areas, overflow, navigation pending state and More-menu initial focus/Tab wrapping/Escape/focus restoration passed. Hydration/runtime guards were retained. Legacy hard-coded light-mode styling remains migration debt, not a page redesign in this PR.

The pre-latest-main publication `9c93b370` / synthetic candidate `6c698b67` passed the full nine-project Linux suite: **255 passed, 24 expected skips, zero failures**, including unchanged phone and other dark visual references ([run](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36316014263)). The latest combined-tree/full-publication acceptance is the live CI source linked above, not this earlier-base result. An initial full-unit run overlapped a resource-heavy Docker build and was interrupted after timeout failures; the sequential full rerun passed unchanged. The slow local Docker build and an intentionally shortened all-device native browser run are not claimed as complete acceptance runs. After the sync merge, an unchanged Hoopgrid import-heavy case timed out once while formatting also ran. Its isolated rerun passed 4/4, and the sequential full rerun passed 2,852 tests with original timeouts and no test changes. Disposable PostgreSQL fixture/season-integrity checks passed; no production database was used.

## Next milestone

UI-01C — demand-driven shared compositions, followed by UI-02 — interactive controls / overlays, UI-03 — Season Predictions pilot, UI-04 — foundation/design review, then feature-by-feature legacy UI migration. None is implemented by this PR. PR #49 is not merged automatically.
