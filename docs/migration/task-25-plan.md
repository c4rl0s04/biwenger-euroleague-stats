---
title: Task 25 ownership closure plan
description: Complete non-UI ownership and adapter cleanup while coordinating the remaining UI migration dependencies.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 25 — Ownership closure plan

Planning baseline: main `1be12d61`, after Task 22. This is an implementation plan,
not an implementation or final acceptance receipt.

## Scope and sequencing

Proceed with **25A: non-UI ownership closure** now. Keep **25B: UI-dependent closure**
with Tasks 23–24 and reconcile it after their integration. Full Task 25 completion
still requires both parts; deferring the UI does not mark it complete or permit
Tasks 26–27 to skip combined acceptance.

Preserve routes, response shapes, ordering, identity precedence, authorization,
provider behavior, cache keys/TTLs, and visuals. No schema work, production operations,
credential changes, dependency upgrades, or feature redesign belongs to this plan.

## Findings to verify during implementation

- The architecture policy currently protects 99 entrypoints and has 139 exact
  exceptions: 138 `entrypoint-persistence` edges and one `legacy-service` edge.
  These are dependency edges, not 139 independent defects. The persistence exceptions
  must be grouped and reviewed by their actual authentication/credential boundary.
- Assistant context imports many domain reads through `src/lib/services/index.ts`.
  Its explicit exception is the clearest adapter-retirement target.
- Team Profile already has a feature-owned service. Its query still reaches
  `src/lib/db/queries/core/teams.ts`, which mixes a SQL helper with exports back into
  Teams. Inspect that round trip before choosing local owner imports.
- Teams and Players still consume `getPlayerFormMap` from the shared global query.
  Players exposes form services but also retains a query adapter. Changing all callers
  to the Players barrel blindly risks a feature dependency cycle.
- `readManagerDirectory` is intentionally shared below features to avoid a documented
  Managers → Players → Teams → Matches → Rounds → Managers cycle. Its location alone
  is not grounds for moving it into Managers.
- The database and service barrels retain many compatibility exports. Their deletion
  depends on live callers, including scripts and dynamic imports, not directory counts.

## 25A — Work that can proceed now

### 1. Establish a complete ownership and consumer inventory

Use a dedicated `refactor/ownership-closure` worktree from then-current main. Check
whether the branch/worktree already exists and preserve active work. Re-read applicable
instructions and the feature-migration skill.

Inventory pages, layouts, routes, server actions, feature entrypoints, shared modules,
CLI commands and workflow-referenced scripts. Start from the existing TypeScript import
graph, but include scripts explicitly: the current graph walker scans `src` only.
Trace aliases, relative imports, re-exports, dynamic imports and script entrypoints;
record unresolved dynamic references for manual review.

Deliver an ownership matrix with: module/export, actual callers, final owner, current
contract, proposed disposition, required tests and dependency/blocker. Classify each as
feature-owned, retained shared infrastructure, temporary adapter, unused code or UI-owned.
Establish focused behavioral baselines before making structural changes.

### 2. Remove Assistant's global service-barrel dependency

Map each imported read to its existing owning feature's `server.ts` contract. Where a
contract is missing, add only the narrow read needed by an identified consumer. Preserve
context selection, identity, budgets/truncation, formatting, ordering and error handling.
Check the resulting feature graph before adopting an export that introduces a cycle.

Run Assistant context/service tests and affected domain contract tests. Once the actual
edge disappears, remove its exact architecture exception. Retire old service wrappers
only after every remaining runtime and test consumer has been accounted for. No real
AI/provider call is needed for verification.

### 3. Close Team/Player and shared-query ownership

Review the Team Profile query's legacy Team helper round trip and the remaining
`getTeamById` callers. Same-feature code should consume the owner's internal module;
cross-feature consumers should use deliberate server contracts.

Trace the form query across Players, Teams, Managers and analytics. Choose a feature
owner only if the dependency graph stays acyclic; otherwise document the narrow shared
read model as retained infrastructure with an explicit responsibility and typed contract.
Keep a single calculation implementation. Preserve finished-match filtering, season
selection, known zero versus DNP versus unknown values, averaging, ordering and limits.

Review the shared manager-directory projection separately. Preserve its season filtering,
minimal fields and acyclic dependency rationale. Do not replace it with account records
or a broader Managers API merely to relocate SQL. Add tests only for uncovered boundary
behavior; retain existing meaningful query and season-isolation tests.

### 4. Retire unused adapters and reconcile policy coverage

After consumer migrations, remove obsolete service/query exports and wrappers in small
batches. Move or adapt their tests to the final owner without deleting compatibility
assertions. Keep the database connection/schema infrastructure identified by Task 22;
there is no requirement to empty `src/lib` or remove useful connection exports.

Review every architecture exception against current code. Remove resolved/stale ones.
For a valid retained infrastructure path, record the exact owner, necessity and policy
rationale. If an exception still needs credential/authentication changes, record it as an
explicit gated item; do not broaden an allowlist, rename debt away or claim final closure.

Classify all unprotected runtime entrypoints: add relevant application entrypoints to
checks, and document deliberate framework/protocol/infrastructure exclusions. Test the
checker with representative forbidden imports if its enforcement changes.

### 5. Verify and produce the non-UI closure receipt

Run focused affected tests after each bounded change. Before integration run the full
`npm run verify` workflow: skills, architecture, docs, typecheck, full tests, lint,
database-disabled production build, schema metadata/Drizzle checks and diff checks.
Use disposable PostgreSQL tests if SQL behavior changes. Run affected API/browser
regressions where runtime rendering or data projection is touched; a structural task
must not silently change visual baselines.

Produce a receipt listing removed adapters, retained infrastructure, resolved and
remaining exceptions, before/after coverage, exact commands/results and the remaining
25B/gated items. Commit bounded changes separately so regressions are attributable.

## 25B — Coordinate with the UI migration

Leave shell, navigation, tokens, shared visual primitives and legacy visual containers
under Tasks 23–24. Do not duplicate their implementation or delete adapters still used
by the active shell worktree. Review its imports before deleting shared modules from main.

After the UI branches integrate, refresh the inventory on the combined commit. Resolve
remaining shell/layout/Section adapters, UI barrels and obsolete presentation imports
with their UI owner. Confirm no competing implementations remain and preserve approved
visual references. Re-run graph/contract checks on the integrated result.

## Completion gates and handoff

**25A is ready** when every non-UI module has an owner/disposition, migrated consumers
use the intended contracts, obsolete adapters are removed, remaining shared modules have
explicit rationale, and required validation passes. Report any gated work as outstanding.

**Task 25 is complete** only after 25B reconciliation and resolution of every temporary
adapter/exception, or explicit acceptance of a justified permanent infrastructure boundary.
A change to documentation alone does not resolve an architectural dependency.

Task 26 then performs full regression acceptance on the combined candidate, including
API/security, desktop/phone/PWA and outstanding Linux coverage. Task 27 remains the
separate release/deployment and final-reconciliation gate.
