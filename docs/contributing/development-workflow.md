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

1. Start from an up-to-date branch or isolated worktree and inspect existing uncommitted changes.
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

Run focused tests during implementation, then the full baseline before review:

```bash
npm run docs:check
npm run lint
npm run typecheck
npm run test:run
SKIP_DB=true npm run build
```

Run additional database or browser checks when the change affects those behaviors. Do not enable
remote database tests merely to satisfy a local check.

## Pull requests

Describe the user-visible outcome, technical boundaries changed, verification performed, and known
follow-up work. Call out intentional API contract changes. For schema work, include backup/audit
evidence and a rollback plan without attaching sensitive dumps.

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
