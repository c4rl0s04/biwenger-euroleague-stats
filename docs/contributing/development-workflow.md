---
title: Development Workflow
description: Repository workflow for scoped, reviewable, tested, and documented changes.
audience:
  - newcomer
  - contributor
  - maintainer
  - agent
status: active
---

# Development workflow

## Before changing code

1. Inspect Git state and create a dedicated sibling worktree following [AGENTS.md](../../AGENTS.md).
   Use [agent setup](agent-workflow.md) for the pinned runtime and reproducible dependency installation.
2. Identify the product domain, architecture boundaries, API contracts, data tables, and operational
   risks affected by the change.
3. Read nearby implementation and tests instead of relying on directory names or documentation
   alone.
4. For database, sync, or external market mutations, follow the safety runbooks before executing
   state-changing commands.

## Implementation

- Keep changes scoped to one objective and preserve unrelated user work.
- Follow the [engineering patterns](engineering-patterns.md) while acknowledging documented legacy
  exceptions.
- Add or update tests with the behavior, including failure paths and boundary validation.
- Update canonical product, architecture, operations, or reference documentation in the same change
  when its contract changes.
- Use small commits that each explain one coherent change and can be reverted independently.

## Local verification

Run tests for the changed behavior and fast checks for the affected code before review. For example:

```bash
npm run test:run -- src/features/teams
npm run architecture:check # when feature boundaries change
git diff --check
```

Run focused browser checks for changed UI behavior when practical, and schema consistency checks
when database-backed models are affected. Do not enable remote database tests merely to satisfy a
local check. The full unit suite, lint, build, and browser matrix run in CI after the pull request
is opened. Use `npm run verify` locally only for a specific risk or failure, or when requested.

## Pull requests

Describe the user-visible outcome, technical boundaries changed, verification performed, and known
follow-up work. For remote review, push the task branch and open a draft pull request unless the
user requests local-only work or remote access is unavailable. Report local results and CI as
pending, then end the agent turn without waiting or polling. Investigate CI failures when the user
asks. Do not merge until required CI checks pass. Call out intentional API contract changes. For
schema work, include backup/audit evidence and a rollback plan without attaching sensitive dumps.

Review documentation like code: verify commands, local links, source references, and operational
safety rather than only prose style.

## Commit guidance

Use imperative, scoped messages such as:

- `feat(market): validate offer ownership`
- `fix(sync): retain season context in listings`
- `docs: document assistant provider selection`
- `test(rounds): cover empty lineup history`

Avoid combining refactors, generated formatting, behavior changes, and unrelated documentation in a
single commit when they can be reviewed and reverted separately.
