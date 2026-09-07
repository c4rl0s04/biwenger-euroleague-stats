---
title: Migration worker protocol
description: Implementation-only workflow, safety boundaries, and reviewer handoff.
audience:
  - agent
  - maintainer
status: active
---

# Worker protocol

## Instructions and scope

Read repository `AGENTS.md`, applicable nested instructions, the repository feature-migration
skill and its required references before implementation. Read relevant installed Next.js guidance
before changing framework code. Follow project-ui guidance when moving screens; no redesign.
The assignment adds exact scope; it does not replace repository safety or architecture rules.

For this user-approved pilot, **full validation is assigned to the independent reviewer**.
The worker still runs baseline/final typecheck, architecture check and diff checks, writes
focused tests with the changes, and leaves them available for review. This explicit task-level
validation split overrides the usual full-verification-before-worker-handoff expectation,
not the final merge acceptance standard. Do not call skipped checks passed.
Normal commit hooks may run formatter/linter; do not disable them.

## Setup

1. Inspect status, branches, worktrees and the pinned assignment base. Do not use current main
   merely because it is the default checkout. Stop on dirty targets or unexpected ancestry.
2. Create the named sibling worktree and branch. If already present, resume only after verifying
   it belongs to this same assignment; preserve unrelated changes and stop on ambiguity.
3. Record the resolved 40-character starting SHA in the worker report before source edits.
   All edits, dependency setup and commits occur in the worker checkout, not the instruction checkout.
4. Use Node 24.20.0 and `npm run worktree:setup` when needed. No dependency upgrades, global runtime
   changes, copying application environment files, provider credentials or production database access.
5. Run baseline `npm run typecheck` and `npm run architecture:check`. Capture failures accurately.
   If the base fails, report BLOCKED unless the coordinator explicitly scopes a correction.

## Implementation

- Trace actual pages, browser requests, routes, services, queries, cache and all consumers first.
  Record a compact contract inventory in the report; the checked-out code is the behavioral baseline.
- Implement the complete assigned user-facing scope using bounded services, server-only queries,
  explicit row-to-serializable-model mappers, thin framework adapters and feature-owned screens.
- Preserve URLs, malformed-input quirks, sorting/ties, nulls, optional fields, errors, auth, HTTP
  envelopes/headers, cache keys/TTLs, season rules, read order, loading and responsive presentation.
- Do not silently correct apparent old bugs. Stop on security/contract conflicts and ask for a decision.
- Keep established feature contracts and existing tests. Do not recreate migrated SQL, import foreign
  internals, create a monolithic service, or use loose database-shaped public models.
- Preserve shared consumers with narrow documented legacy adapters to a single implementation.
  Remove files only after checking all imports, dynamic imports and re-exports.
- Write focused characterization, mapper, service, boundary and HTTP tests alongside extraction.
  The reviewer runs them. Small diagnostic runs are allowed if useful; avoid repeated full builds.
- Register migrated entrypoints in architecture policy. No checker changes, broad exceptions,
  weakened assertions, skipped failing tests, auth bypasses or regenerated visual references.
  If new exceptions beyond the assignment are required, stop for review.
- Keep changes modular. No other feature, framework upgrade or speculative shared abstraction.

## Hard prohibitions

No push, merge, rebase, deployment, production smoke requests, provider mutations, database
schema/migration changes, secrets/environment changes, fallback changes or RLS changes.
Do not alter authentication, sessions, credentials, private Market/Lineup operations or Settings.
Do not expose secrets in terminal output, reports, tests, snapshots, errors or logs.
Do not edit primary main, another worktree, central queue, root instructions or test/checker configuration.

## Finish

Run final `npm run typecheck`, `npm run architecture:check` and `git diff --check`.
Also run `git diff --check <recorded-base-sha>` across the full change range.
A failure means BLOCKED/needs correction, not READY_FOR_REVIEW. Do not suppress it.
Commit implementation and tests in logical local commits; commit the report separately.
Record source commit SHAs in the report; its own final SHA is discoverable via Git, avoiding
a self-referential commit hash. Confirm the worker checkout is clean.

Use the [report template](report-template.md). List commands actually run and every deferred
check. End with branch, worktree, source commits and report path, then stop.
Do not pick the next batch, launch other agents, wait indefinitely, or change review status.
