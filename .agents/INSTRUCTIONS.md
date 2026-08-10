# Biwenger Stats agent instructions

Use [`docs/README.md`](../docs/README.md) as the canonical project knowledge base. Do not duplicate
long-form architecture or operational guidance in agent-only files.

## Non-negotiable engineering rules

- Preserve uncommitted user changes and keep unrelated changes out of the task.
- Treat production fantasy data as non-reconstructable. Follow the
  [database safety runbook](../docs/operations/database-safety.md) before schema or repair work.
- Keep database reads in `src/lib/db/queries/`, writes in `src/lib/db/mutations/`, business logic in
  `src/lib/services/`, and HTTP concerns in `src/app/api/`.
- Keep API handlers thin: authenticate and validate input, call the service layer, then return the
  standard response envelope.
- Make sync writes idempotent and register pipeline work through the numbered orchestration steps.
  Never bypass the season guard or advisory lock in production.
- Add `server-only` to server-exclusive modules and preserve Server/Client Component boundaries.
- Update the canonical documentation in the same change when behavior, routes, configuration,
  schema, commands, architecture, or safety rules change.

## Required reading by task

- Feature work: [product map](../docs/product/README.md) and
  [application layers](../docs/architecture/application-layers.md).
- Data or sync work: [data and sync architecture](../docs/architecture/data-and-sync.md),
  [data sync runbook](../docs/operations/data-sync.md), and
  [database safety](../docs/operations/database-safety.md).
- Contribution and verification: [development workflow](../docs/contributing/development-workflow.md)
  and [testing](../docs/contributing/testing.md).
- Documentation changes: [documentation style](../docs/contributing/documentation-style.md).
