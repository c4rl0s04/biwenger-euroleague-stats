---
title: Complete architecture migration plan
description: Exhaustive completion campaign covering remaining domains, sensitive flows, UI ownership, infrastructure and release evidence.
audience:
  - maintainer
  - agent
status: active
---

# Complete architecture migration plan

## Purpose and authorization

Finish the existing architecture migration without redesigning the product. This is a planning
deliverable, not permission to start implementation, push, deploy, change credentials, or perform
production operations. The user intends to execute future work through this agent, sequentially by
default. Do not spawn workers merely because historical assignments mention parallelism.

Baseline inspected: main `354f66e1585cb59a15efe96f094defdba6ad1e65`, after Rounds/Standings release.
Reconcile against current Git and source before execution; this document is a complete work breakdown,
not a substitute for inspecting each call chain. Newly discovered migration work must be assigned
to a package below before declaring completion. Never hide it as an unspecified future follow-up.

Read [repository instructions](../../AGENTS.md), [application layers](../architecture/application-layers.md),
[coverage](../architecture/migration-overview.md), [ledger](../architecture/migration-status.md),
[testing](../contributing/testing.md), and the repository feature-migration skill.
For the final UI pass, also follow [UI layering](../architecture/ui-component-layers.md)
and the project-ui skill. Read relevant installed Next.js guidance before code changes.

This campaign includes planning the previously deferred security and UI scopes. Their implementation
still needs explicit scope approval. A blocked gate means the entire campaign is not finished;
it must not be relabeled completed or quietly removed from the plan.

## What complete means

There are three separate milestones:

1. **Implementation complete:** every active runtime entrypoint and domain module has verified
   ownership; all packages below are accepted; no temporary migration debt remains.
2. **Release complete:** the accepted commits are on main and origin/main, required CI is green,
   production serves the same SHA, and safe release checks pass.
3. **Campaign closed:** final documentation, compatibility inventory, remaining infrastructure
   decisions, visual evidence, and Git/worktree preservation audit are reconciled.

No percentage based on folder count. A feature folder, service extraction, or green typecheck alone
does not satisfy any milestone.

Permanent framework/infrastructure modules are allowed outside features. Keeping a tested legacy URL
as a thin handler is allowed. Keeping unowned domain logic or an unexplained migration exception is not.
Premium redesign, new animation, dependency upgrades, new product functionality and unrelated historical
branch work are not architecture completion criteria. Cosmetic JavaScript-to-TypeScript conversion is
not required; all exposed data boundaries must nevertheless be explicitly typed.

## Target invariants for every package

- Pages/layouts adapt framework inputs, call services and compose screens.
- Existing handlers/actions adapt the same services; no Server Component calls internal REST.
- Queries/repositories own persistence. Services own orchestration, access and freshness.
- Explicit mappers expose plain typed serializable models, not raw DB/provider records or public any.
- Client-safe public.ts and server-only server.ts expose deliberate contracts; no cross-feature
  internal imports or dependency cycles, including type-only cycles.
- Browser hooks own interaction state, not hidden database/domain ownership.
- Preserve URLs, query quirks, ID precedence, status/envelope/field types, ordering, season selection,
  authentication, authorization, caching, invalidation and error behavior.
- Preserve desktop/mobile content, appearance, interactions, loading/empty/not-found/error states.
- Session-dependent and private/mutation responses must not be publicly cached. If legacy behavior
  conflicts with safety, report it and propose a separate approved correction before changing it.
- No schema or provider behavior changes as incidental cleanup. Use synthetic fixtures and mocked
  provider boundaries; never real provider mutations to validate a structural move.

## Execution model and token budget discipline

Use one dedicated campaign worktree/branch for sequential implementation, for example
`../biwengerstats-next-architecture-completion` on `refactor/architecture-completion`.
Inspect branches, stashes and all worktrees first. Reuse that clean task worktree between packages;
a new worktree per feature is unnecessary. Separate concurrent workers, if later explicitly authorized,
would require separate worktrees and reserved shared files.

Do not start from an old worker branch. Fetch and pin the approved base. Preserve unrelated changes.
Reuse existing draft assignments 002–012 in the [queue](README.md), updating their exact source range
and scope before use rather than creating competing instructions. Historical Standings reviews remain
historical. This master plan adds completion packages not covered by those drafts.

For each package:

1. Record exact file/route/method/export inventory, current callers, tables/artifacts and dependencies.
2. Record contracts and focused baseline; capture original desktop/phone evidence before moving UI.
3. Implement bounded query, mapper, service, model, handler and screen ownership together.
4. Run focused tests and architecture/type checks during development; fix issues before continuing.
5. Run required acceptance checks before calling it VERIFIED. Commit logically scoped changes and
   record SHA, commands/results, remaining adapters with owners, and the next package.
6. Continue only to a dependency-ready authorized package. Pause only for a real decision, failure,
   missing environment, or security/release approval—not to repeat the same scope explanation.

Keep one concise execution receipt per package, referencing logs/artifacts instead of pasting them.
Do not re-read the entire ledger or audit unchanged features every turn. Checkpoint SHAs allow review
of only changed code. Reuse fixtures and test helpers; do not weaken tests to save tokens.

Repository rules still require full acceptance checks at a completed implementation handoff.
Batching multiple packages into one acceptance run is permissible only if they remain explicitly
IMPLEMENTED, not VERIFIED, until that combined run passes. Always run full checks on the final candidate.
Do not repeatedly build after documentation-only edits; run documentation checks for those edits.

## Stage 0 — Establish a closed inventory and baseline

**Package C00. Discovery and baseline are required before feature edits.**
During execution, detailed semantic tracing is completed for each package before its edits;
the global inventory remains open until every package and C14 close it. This sequencing avoids
repeating full-repository tracing before unrelated slices; it removes no inventory or final acceptance
requirement. A compiled baseline browser run may finish while source-only work proceeds, provided its
build, fixtures and browser tests remain unchanged and no competing build overwrites it.

Create an execution inventory under docs/migration with one row per entrypoint, plus ownership groups
for every runtime module. Include route methods, Server Actions, layouts, proxy/auth adapters, API routes,
scripts/jobs, dynamic imports, hooks, caches, public assets/workers and browser-side API consumers.
Discover routes from src/app and verify against the existing route-manifest tests and build output;
do not assume sidebar pages cover the application.

For each entry record: current path, owner, direct/transitive data calls, identity/access, cache layers
and key inputs, read/write effects, model/presentation owners, tests, target package, status and evidence.
For each remaining module record: migrate / retained infrastructure / permanent compatibility adapter /
obsolete with zero consumers. A classification needs a reason and reviewer evidence, not just a label.

Inspect src/lib/services, db/queries, db/mutations, logic, hooks, home, season-review, api, auth,
credentials, sync, constants, utils, mobile and pwa; src/hooks; all components including mobile screens;
feature internals; src/auth.js; src/proxy.js; root/app layouts; scripts and public workers.
Inventory re-exports, aliases, dynamic references and fixtures before removing anything.

Record all local branches/stashes and compare ancestry/patch equivalence. Old PWA, Season Review v5
and sync work must be preserved and explicitly classified as integrated-equivalent or separate product
work, not merged merely to make the branch list empty.

Establish full verify/browser baseline and existing warnings. Reconcile stale status language:
Rounds and Standings are deployed, not unfinished implementations. Record existing Linux visual-reference
gaps for Manager Profile/Rounds/Standings as C14 work, not hidden permanent skips.

**Exit:** no unassigned active entrypoint or legacy domain module; exact inventory committed.
Counts are recorded evidence, not permanently hard-coded expectations.

## Stage 1 — Complete domain foundations and independent read experiences

### C01 — Manager directory and remaining analytics (existing batch 005)

Scope: /api/users and all remaining directory/statistical callers, not a new manager-list page.
Start from src/lib/db/queries/core/users.ts, shared manager-directory.ts, legacy userService and
statsService, and remaining analytics/records helpers. Trace actual exports before assigning ownership.

Keep /user/[id] and its sections as completed reference flows. Separate manager identity/squad facts,
Rounds history, Standings calculations and Market activity. Move analytics to their true owner and expose
narrow contracts. Preserve the intentionally shared manager-directory query if it remains necessary to
avoid the known Managers → Players → Teams → Matches → Rounds cycle; document and test that decision.
Do not turn infrastructure into a feature-barrel cycle.

Protect /api/player/rounds, /stats and /squad despite their legacy names. Preserve session fallback and
exact private/no-store semantics. Lineup and Assistant consumers remain unchanged until their packages.

**Exit:** all remaining manager facts have an owner; no duplicated directory SQL; Profile regression
tests pass; adapters list exact remaining callers and retirement packages.

### C02 — Tournament analytics and screens (existing batch 002)

Routes: /tournaments, /tournaments/[id], /tournaments/[id]/[section].
Complete existing features/tournaments; inspect legacy tournamentService, tournament queries and
components/tournaments plus phone screens. Reuse released core/participation contracts.
Move analytics, page orchestration, typed projections, sections/cards and loading/error behavior.

Preserve phase formats, fixture/standing ordering, manager participation and Profile competition
consumers. Enumerate actual section values and redirects before edits. Do not change tournament sync
writes in this read package.

**Exit:** all Tournament screens and read consumers use owned contracts; Profile participation is
unchanged; old wrappers have no implementation duplication.

### C03 — Predictions (existing batch 003)

Routes: /predictions and /predictions/[section].
Trace predictionsService, prediction queries/normalization SQL, components/predictions and callers
without dedicated HTTP routes. Own read orchestration, validation, scoring/pure calculations, models
and screens under features/predictions. Reuse Rounds calendar policy.

Preserve prediction versus fantasy scores, ties, missing outcomes, season scope and user identity.
Inventory any writes or actions; separate them into C11 rather than silently including or forgetting them.

**Exit:** full read experience migrated with formula and section/contract tests; every write has an owner.

### C04 — Playoffs (existing batch 004)

Routes: /playoffs and /playoffs/predictions/[userId].
Trace playoffService and components/playoffs. Establish features/playoffs with explicit bracket,
prediction and result projections. Consume other domains through their contracts, not their scoring
internals. Do not merge Playoffs and Predictions formulas because they look similar.

Test phase transitions, ties, missing games, invalid user IDs, ranking order and private/public output.
Inventory and assign any writes to C11.

**Exit:** all Playoffs read screens and consumers migrated; original scoring and access preserved.

### C05 — Public Market analytics (existing batch 007)

Routes: /market, /market/[section]; public/statistical methods in /api/market, /stats,
/stats/value-details, /transfers, /trends and /duels/details.
Classify each actual method and data source before deciding it is public; URL names are not access policy.

Inspect both legacy marketService locations, market queries, market components and shared consumers.
Use bounded market analytics/catalogue services, not a single service mixing statistics and provider
transactions. Preserve prices, ownership, ordering, cache keys, TTLs and update behavior.
Market offers/sell/remove/private operations are C11 and remain frozen here.

**Exit:** public reads/screens owned; explicit separation from private operations; Dashboard/Home/Profile
callers receive safe contracts; no private listing or session fallback becomes publicly cached.

### C06 — Season Review (existing batch 011)

Routes: /season-review, /season-review/[section] and its actions.ts.
Inventory src/lib/season-review, analytics/season-review queries, resilience service, components and
artifact-generation scripts. Keep pure engines separate from artifact repositories and page orchestration.
Preserve historical season semantics, artifact versions, generation versus read behavior and calculations.
Classify each Server Action as read or write; generation side effects need C11/C12 review where applicable.

Do not integrate separate unpublished Season Review v5 functionality during this structural migration.

**Exit:** engine/readers/screens have explicit ownership; reproducible artifact and formula tests pass;
scripts use deliberate contracts and no action's side effects are lost.

## Stage 2 — Migrate composition pages and retire their shared dependencies

C07–C10 follow the contracts they actually need, not an arbitrary calendar. C01–C06 are the default
upstream wave. Discovering a missing upstream contract requires a small owned addition and tests,
not duplicated SQL inside the downstream feature.

### C07 — Schedule (existing batch 006)

Routes: /schedule, /schedule/map. Trace scheduleService, competition/schedule queries and components.
Use Matches for sporting games/map, Rounds for fantasy calendar and Managers for squad facts.
Move overlay orchestration and screens into features/schedule; preserve dates, time zones, filters,
map behavior and desktop/mobile parity. Do not copy Matches map internals or change provider tiles.

### C08 — Compare (existing batch 009)

Routes: /compare, /compare/[userId], /api/compare/data and /api/compare/data/lite.
Own comparison orchestration and typed models under features/compare. Move the retained legacy
Rounds HeadToHeadCard to its actual Compare owner after consumer checks.
Reuse Managers, Rounds, Standings and Market contracts. Preserve selection identity, full versus lite
responses, ordering, independent loading and existing cache/access behavior.

### C09 — Dashboard (existing batch 008)

Routes: /dashboard, /dashboard/[section]; all /api/dashboard/\* methods:
birthdays, captain-stats, captain-suggest, home-away, ideal-lineup, leader-gap,
market-opportunities, mvps, next-round, recent-activity, rising-stars, top-form and top-players.
Reconcile this list against C00 rather than treating it as exhaustive forever.

Dashboard owns composition, not every underlying statistic. Move leader-gap/league-average ownership
to Standings, last-round/calendar calculations to Rounds, manager facts to Managers, player insights
to Players and public opportunities to Market. Add narrow contracts where required.
Preserve personal fallback identity and private cache behavior, loading order, recommendations and
all section/card interactions. Do not change Lineup mutations when sharing ideal-lineup logic.

### C10 — Home, News and remaining public aggregation (existing batch 010)

Routes: /; /api/home/activity, /api/news, /api/landing-stats, /api/stats/leaders and
/api/league-average. Assign each underlying calculation to its true domain; URL location is not ownership.
Trace homeService, appShellService, home-feed/home-summary queries, src/lib/home, news/feed parsing,
home components and mobile composition.

Keep news ingestion/parsing separate from Home screen composition when their responsibilities differ.
Preserve feed filters, pagination/cursors, ordering, time handling, independent loading and partial failures.
Close the separate last-round Home projections through Rounds contracts.

**Stage 2 exit:** every aggregate page uses owning contracts; no shared statistic is reimplemented.
Retire upstream compatibility adapters only after their final consumers are moved.

## Stage 3 — Close sensitive domains, not merely defer them

**C11 requires a written scope/security approval before implementation.**
The plan includes this work, but the current planning request does not grant that approval.
Read [security gates](security-gates.md) and applicable security instructions at execution time.

For each subpackage first record the trust boundaries, ownership checks, identity precedence,
cache policy, side effects, provider calls, persistence, error/log redaction and regression matrix.
If preservation conflicts with a security requirement, propose the smallest explicit correction.
Do not silently harden or loosen externally visible behavior during a move.

### C11a — Accounts, Settings and authentication integration

Routes: /settings, /settings/[section], /login, /api/user/change-password,
/api/user/link-biwenger and /api/auth/[...nextauth]; auth/proxy/layout consumers.
Own account business orchestration and Settings screens deliberately; keep Auth.js protocol/session
infrastructure and credential repositories in clearly reviewed server-only infrastructure where appropriate.

Close existing architecture exceptions with narrow trusted infrastructure boundaries, not broad exemptions.
Preserve token omission, encryption/keyring/fallback behavior, hashing, linking, session contents and
ownership checks. Do not rotate AUTH_SECRET, disable plaintext fallback or alter keys/environment.
Test with synthetic credentials and mocked providers only.

### C11b — Lineup and private Market operations

Routes: /lineup, /lineup/[section], /api/users/lineup, private methods of /api/market,
and /api/market/offers/accept, /offers/reject, /remove, /sell-all and /sell.
Trace lineupService, lineupResponse, marketActionsService, private marketService,
providerMutationResult and all browser callers.

Separate read models from command services/repositories/provider adapters. Commands deliberately enforce
identity and authorization; retain request validation, response redaction, invalidation, error semantics
and existing partial-failure/retry behavior. Do not introduce retries that duplicate provider mutations.
Keep /api/player/squad's shared manager contract stable.

### C11c — Hoopgrid, including non-sidebar routes

Routes: /hoopgrid, /hoopgrid-cheatsheet, /test-hoopgrid;
all methods of /api/hoopgrid/today, /list and /guess; src/hooks/hoopgrid and its service/components.
Inventory challenge creation during GET, guess persistence, private responses and answer visibility.
Separate challenge reads, creation and guess commands without changing protocol semantics implicitly.
Any conversion from GET side effects requires an explicit compatibility/security decision first.
Do not delete test/cheatsheet URLs or expose answers under the guise of cleanup.

### C11d — Assistant and conversations

Routes: /assistant, /assistant/[conversationId], /api/assistant,
/api/assistant/conversations and /api/assistant/conversations/[id], including every HTTP method.
Own orchestration/context building, conversation repository, provider adapter and typed/redacted
presentation models. Consume domain services instead of database internals.
Preserve user ownership, streaming/cancellation, history order, privacy, errors and provider behavior.
Mock model calls; no real requests with private production context or paid generation for validation.

### C11e — Other inventoried commands

Close all writes/actions discovered in Predictions, Playoffs, Season Review and elsewhere.
Every command must be assigned, approved where sensitive, tested and either migrated or retained as
reviewed infrastructure. An empty row needs source evidence; absent sidebar links are not evidence.

**Exit:** sensitive business flows meet target boundaries and compatibility/security tests. No open
authorization blocker can coexist with a claim that the whole migration is finished.

## Stage 4 — Infrastructure and non-page ownership

### C12 — Infrastructure, ingestion, scripts and cache lifecycle

Review existing src/lib/db pool/schema/season/transaction infrastructure, src/lib/api provider clients,
src/lib/sync pipeline/services, database mutations, auth/credentials, scripts, artifacts and cache helpers.
This is an ownership and dependency closure pass, not a mandate to relocate a working sync pipeline.

Retain legitimate infrastructure in documented modules with explicit server-only contracts and tests.
Move any remaining business query/orchestration out of generic utilities to the appropriate owner.
Give shared ingestion writes a deliberate owner; prevent feature UI/services from importing sync internals.
Verify season/write guards, advisory locks, idempotency, failure handling and cache invalidation through
fixtures/mocks. Do not run sync commands against providers or production.

Audit all cache mechanisms: HTTP headers, Next route/static behavior, React/request cache, persistent
server cache, custom memory caches and invalidation after commands/sync. Preserve legitimate policies;
verify identity/season/parameter keys and ensure private responses cannot leak between users.
Use approved fixes for discovered vulnerabilities rather than claiming unsafe preservation is acceptable.

Framework routes, root error/loading/not-found boundaries, manifest, /install, /offline and service-worker
assets can remain infrastructure. Inspect them and document why. Do not invent feature wrappers.
Every unresolved infrastructure architecture issue is work, not a blanket exclusion.

**Exit:** each retained non-feature runtime group has an owner, rationale, allowed dependencies and tests;
no hidden domain logic or unnamed follow-up; no schema/configuration/dependency changes.

## Stage 5 — Finish component architecture without redesign

### C13 — Shell, search and the agreed UI layering pass (extends batch 012)

Run after domain boundaries and sensitive access contracts are stable. Scope includes root/app layouts,
navigation, profile/manager selectors, notifications, search interactions, providers, PWA shell,
src/components/layout/common/mobile/ui/user, shared hooks and remaining screen files.
Search's data boundary is already migrated; finish its browser/shell composition, not its SQL again.

Use the agreed [UI layering target](../architecture/ui-component-layers.md):
tokens → primitives → reusable controls → domain components → cards/sections → screens → pages.
These are responsibilities, not compulsory wrappers or folders.

Inventory duplicated behavior inside cards (selectors, avatars, filters, labels), not just card frames.
Keep generic controls domain-independent; place ManagerSelector/PlayerSelector or equivalent domain
controls with their owners and expose public contracts only when acyclic.
Do not move manager domain code into shared UI to bypass a dependency cycle.

Extract meaningful components/sections from large screens, including earlier migrated features where
the future layering target was not yet completed. Reconcile demonstrated repeated token use without
changing colors, sizes, breakpoints, animation, accessibility semantics or domain color meanings.
Preserve loading/error behavior, keyboard/focus handling, safe areas, scroll and mobile navigation.
Do not make every JSX fragment a component or build a universal card/chart with unrelated switches.

**Exit:** pages/screens compose appropriately owned reusable components; UI primitives import no domain;
no duplicated domain interaction implementation remains without a justified distinct responsibility.

## Stage 6 — Exhaustive closure and release

### C14 — Adapter removal, enforcement and final acceptance

- Re-run C00 discovery and diff the complete inventory. Assign new routes/modules before acceptance.
- Check earlier Matches/Teams/Players/Managers/Rounds/Standings/Search boundaries and every external
  consumer. Remove obsolete wrappers, barrels, dead files, imports and migration exceptions only with
  proven zero consumers. Include dynamic imports, scripts and tests in consumer searches.
- Retain old HTTP URLs as thin tested compatibility handlers. No arbitrary canonical rename is required.
- Extend architecture enforcement to every active product page, layout, route and Server Action;
  explicitly classify infrastructure entrypoints. Prevent future unregistered entrypoints.
- Test transitive client/server graphs, cycles, persistence ownership and legacy-domain imports using
  negative fixtures. Do not merely make policy counts larger or allow whole directories.
- Produce a final list of every remaining src/lib/global component group: owned infrastructure,
  generic reusable UI, or permanent protocol compatibility with rationale. Temporary migration
  adapters/TODOs/exceptions must be zero; deleting the entire lib directory is not a goal.
- Capture missing original Linux Profile/Rounds/Standings references from their documented original
  commits using the pinned environment; compare current output without seeding from migrated screens.
  Close all additional visual-reference gaps discovered during the campaign.
- Run full validation below on the exact integrated candidate. Recheck API method/route manifests,
  all phone sections, desktop redirects, empty/error/missing inputs and cross-user cache behavior.
- Reconcile overview, ledger, API/product references, architecture docs, old queue, assignments and
  receipts. Historical notes remain historical with prominent links to final state.
- Audit all Git worktrees, branch tips, stashes and untracked files again. No migration work may exist
  only in an uncommitted file, unpublished side branch or stash at release closure.

**Exit:** zero unassigned modules/entrypoints, zero unresolved migration work, zero failed required checks
and zero outstanding migration visual-verification gaps. Pre-existing unrelated warnings may remain
only if explicitly recorded and shown not to be regressions.

### C15 — Authorized integration, deployment and closure receipt

Implementation approval does not automatically authorize this stage. Obtain release authorization.
Inspect fresh origin/main and all task checkouts. Integrate the exact validated history by fast-forward
when possible; stop for unexpected divergence. No force-push or unapproved unrelated changes.

Push, follow CI and automatic Vercel deployment to final success, verify deployed SHA equals origin/main,
and perform safe read-only smoke checks against the frozen route/API inventory. Use an existing safe
authenticated session when available; never request/store secrets to bypass a verification limitation.
For mutation functionality rely on synthetic tests, not production commands.

Check deployment-scoped errors/5xx and redacted credential-pattern detection; record bounded evidence.
Complete the documented desktop/phone review and any authorized manual checks. If unavailable, report
the campaign as awaiting verification rather than completed. Preserve previous working deployment
on failure and propose only a scoped recovery.

Final receipt: all package SHAs, final main SHA, CI, deployment ID/URL/SHA/status, validation commands,
visual matrix, remaining legitimate infrastructure/protocol adapters, unrelated warnings and Git audit.
Clean up task worktrees only after ancestry verification and applicable cleanup authorization; never
delete unrelated branches/stashes to satisfy a cosmetic clean-state goal.

**Exit:** implementation, release and campaign closure criteria all satisfied.

## Validation and evidence matrix

| When                    | Required evidence                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Before a package        | Pinned source, observable contracts, focused baseline, original visual reference when UI moves                      |
| During implementation   | Typecheck, focused domain/mapper/service/validation/HTTP/action tests, architecture check, diff check               |
| Before VERIFIED/handoff | npm run verify; affected browser contracts and unchanged screenshots; no missing required checks                    |
| Combined candidate      | npm run verify; full npm run test:e2e:local; CI-style source formatting; inventory/route/adapter audit              |
| Sensitive package       | Ownership and cross-user cache matrix; mocked command/provider outcomes; credential redaction; failure paths        |
| Final release           | Required CI green; matching production SHA; read-only route/API/log checks; desktop/phone evidence; clean Git audit |

npm run verify includes skills, architecture, docs, typecheck, full unit suite, lint,
SKIP_DB=true build, schema metadata audit, Drizzle consistency and git diff --check.
Run explicit focused tests in addition. Follow the testing guide for the disposable database/browser
runner. Never load production secrets, relax browser error guards, increase snapshot tolerances to hide
regressions, suppress security findings, or silently skip failures.

## Progress checklist

All remaining packages are PLANNED, not dispatched by creating this document.

- [ ] C00 Closed inventory and baseline.
- [ ] C01 Manager directory/analytics.
- [x] C02 Tournament complete read experience (local acceptance: e14fe39a; release remains C15).
- [x] C03 Predictions reads (locally verified; release remains C15).
- [ ] C04 Playoffs reads.
- [ ] C05 Public Market reads.
- [ ] C06 Season Review.
- [ ] C07 Schedule.
- [ ] C08 Compare.
- [ ] C09 Dashboard.
- [ ] C10 Home/News and public aggregation.
- [ ] C11a Accounts/Settings/auth integration approved and accepted.
- [ ] C11b Lineup/private Market approved and accepted.
- [ ] C11c Hoopgrid approved and accepted.
- [ ] C11d Assistant approved and accepted.
- [ ] C11e All other commands accounted for and accepted.
- [ ] C12 Infrastructure/cache/script ownership closed.
- [ ] C13 Shell/search/shared and domain UI layering complete.
- [ ] C14 Global enforcement, cleanup, documentation and all verification complete.
- [ ] C15 Authorized release and final preservation audit complete.

At every checkpoint record status, exact SHA, evidence and blocker if any. The checklist must remain
open while any required implementation, approval, visual check or release gate is missing.
