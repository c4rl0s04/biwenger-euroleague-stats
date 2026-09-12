---
title: Architecture campaign execution
description: Current checkpoint, closed-inventory progress and acceptance evidence for the completion campaign.
audience:
  - maintainer
  - agent
status: active
---

# Architecture campaign execution

## Current checkpoint

Implementation authorized by the user after approval of the [completion plan](completion-plan.md).
Branch: `refactor/architecture-completion`.
Worktree: `../biwengerstats-next-architecture-completion`.
Fetched main/origin/main: `354f66e1585cb59a15efe96f094defdba6ad1e65`.
Campaign base carries planning commit `6ad78eb8`; no unrelated branch was incorporated.

**C00 and C01 IN PROGRESS. No package is newly VERIFIED.** The Manager directory checkpoint
is implemented; see [C01 evidence and remaining scope](reports/c01-manager-reads.md).
The full goal remains all C00–C15 packages, not merely the first migration.
Sensitive policy changes and production release remain explicit gates in the plan.

## Inventory discovery

[Source inventory](campaign-inventory.json) records 794 non-test source modules and
136 discovered framework/auth entrypoints (including root boundaries), with direct imports and preliminary package
assignments. It uses the repository's existing TypeScript-resolved architecture graph.
Assignment is a triage queue, not evidence of correct ownership or a completed security review.

AST export discovery additionally records 82 explicit HTTP method exports (including Auth.js aliases),
route cache declarations, 57 ancillary script/worker/configuration/style files and 47 package commands.
These inventories are coverage evidence, not semantic acceptance or permission to execute commands.

Remaining C00 work:

- Reconcile all exported HTTP methods, including aliases/re-exports and framework-generated methods.
- Trace actual calls rather than treating every import of a legacy barrel as a runtime dependency.
- Record access/identity, cache layers/keys, models, data sources and side effects per entrypoint.
- Extend coverage to scripts/jobs, public workers/assets and non-JavaScript runtime/configuration files.
- Associate existing tests with actual contracts; missing tests remain explicit.
- Review mixed-package assignments and remaining infrastructure candidates; none is exempt by default.
- Complete baseline full verify and disposable browser suite before feature edits.
- Reconcile old status headings through current-release links without deleting historical evidence.

## Initial source findings

- `src/lib/services/statsService.ts` owns global Tournament calculations. It belongs to C02,
  not Managers merely because it produces per-manager statistics.
- `src/lib/services/core/userService.ts` still wraps global directory/profile reads.
  The profile services already exist; C01 must inventory callers before retiring wrappers.
- `src/lib/db/queries/core/users.ts` mixes directory, squad/captain/home-away/alert reads and
  `getUserWithPassword`. Credential-related access remains C11a, not incidental C01 cleanup.
- The shared `manager-directory.ts` query deliberately avoids a feature cycle. Keep that
  reviewed shared projection unless a source-backed acyclic ownership alternative is established.
- `/api/users` currently calls the legacy service barrel, uses force-dynamic and LONG success caching.
  Preserve its exact response/ordering and runtime text IDs/nullability in C01.

## Validation and preservation

- Worktree setup PASS: Node 24.20.0, 688 packages; no lockfile edits.
- Existing esbuild-kit deprecation and install-script approval notices retained unchanged.
- Baseline `npm run verify`: PASS. Skills (6), graph (794 modules/44 protected entrypoints),
  typecheck, 1,277 tests plus one existing skip, lint (0 errors/25 existing image warnings),
  SKIP_DB production build, 38-table metadata audit, Drizzle check and diff check passed.
  Missing-provider build warnings are unchanged. No application environment files were present.
- Built app-paths manifest reconciliation: 125 entries, zero missing inventory routes after
  explicitly accounting for generated internal boundaries and manifest.webmanifest.
- Updated documentation checks passed; the full disposable browser baseline is the next gate.
- No environment files copied, production operations, secrets, provider calls, push or deployment.
- Existing PWA/Season Review/sync branches and both pre-existing stashes remain untouched.
  Their detailed ancestry/content classification remains part of C00/C14; no blanket merge/deletion.
