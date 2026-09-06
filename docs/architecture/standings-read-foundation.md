---
title: Standings read foundation
description: Bounded ranking and league overview migration contracts.
audience:
  - contributor
  - maintainer
status: active
---

# Standings read foundation

Branch `refactor/standings-read-architecture` starts from `832b4c75`. This is the
base ranking foundation, not the complete Standings analytics/screens migration.

## Ownership and flow

`src/features/standings` owns full/simple standings, squad-value rankings and the
league overview. Routes and the base mobile page call its server service. Services
invoke a server-only query projection and explicit allowlisting mappers. Independent
public DTOs preserve existing snake-case contracts; bigint aggregate values remain
strings, integer/float casts remain numbers, nullable sums remain null, and absent
overview records remain omitted in JSON. No raw records escape the service.

The deliberate `getSimpleStandings` server contract supports Managers without a
foreign internal import. Queries use the established database connection singleton,
not the legacy query barrel. Season resolution remains in the query layer.

Legacy `getExtendedStandings`, `getSimpleStandings`, `getLeagueTotals` and
`getValueRanking` query names remain adapters for AppShell, Compare, Dashboard,
Assistant and unmigrated statistics. Legacy application service wrappers also
remain for those callers. Remove adapters as those owners migrate, not by creating
another implementation. No Managers/user query file is edited in this slice.

## Compatibility

- `/api/standings/full`: same success envelope, public max-age 60 and stale 60.
- `/api/standings/league-totals` and `/api/standings/value-ranking`: same envelope,
  public max-age 900 and stale 60. The old league-totals comment said 3600, but the
  executable policy was always 900; only that inaccurate comment is removed.
- All three retain force-dynamic, generic 500 errors and private/no-store error
  headers. There is no session fallback or user-dependent response selection.
- The base `/standings` page remains force-dynamic and protected by the existing
  app boundary. Desktop browser reads and mobile server reads retain their different
  compositions. Components, visuals, loading/empty/error behavior and navigation
  are unchanged; full screen ownership remains a later analytics slice.
- URL parsing keeps first values, empty sort, exact lowercase direction matching,
  unknown-sort fallback, and ignored unrelated inputs. Legacy prototype-name quirks
  are intentionally retained: `__proto__` throws during SQL construction, while
  `toString`/`constructor` become bound values, not interpolated SQL identifiers.
  Changing that external malformed-input behavior needs an explicit decision.
- Every service call rereads the current season; no persistent or request cache is
  added. League overview's six reads remain sequential, including its optional
  streak-query fallback. Completed-round filters, ties, ranking order, participation
  rules, average rounding and 34-round fallback are unchanged.

## Evidence and remaining work

Baseline typecheck and 33 focused API/Assistant tests passed after pinned-runtime
worktree setup. All 21 SQL templates across the four extracted query functions
compare byte-identically with the original commit. Feature tests cover parsing,
query filters/order/casts, service freshness/errors, allowlists, nulls and bigint
types, and real route/service/mapper envelopes and cache behavior. Global graph and
server-guard tests also cover the feature. After extraction, typecheck and all 95
focused feature/API/architecture tests passed. Architecture check passed (701
modules), and formatting/diff checks passed. Final combined verification belongs to
the integration batch; no production operations occur in this worktree.

Historical progression, round winners, win counts, leader-gap composition,
performance analytics, draft analytics and screen/component relocation remain
legacy. This slice does not alter their formulas or claim them migrated.
