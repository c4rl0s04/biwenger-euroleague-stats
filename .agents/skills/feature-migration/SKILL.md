---
name: feature-migration
description: Migrate a Biwenger Stats domain from legacy global layers into feature-owned services, view models, and screens while preserving existing UI and HTTP contracts. Use for architectural migration, not ordinary styling or unrelated cleanup.
---

# Feature migration

Read [AGENTS.md](../../../AGENTS.md), [application layers](../../../docs/architecture/application-layers.md),
and the [migration ledger](../../../docs/architecture/migration-status.md). Use current code and Git
state as evidence; the ledger can contain historical snapshots.

## Establish the slice

Identify the domain owner, pages, HTTP consumers, cross-feature dependencies, and relevant tables.
Inventory observable contracts before editing: URLs, query quirks, identity precedence, authorization,
response envelopes/statuses, ordering, freshness, and desktop/mobile states. Existing route tests and
representative rendered screens are evidence; directory names alone are not.

Record a baseline using [the verification workflow](../../../docs/contributing/testing.md). Keep
structural moves separate from redesign, provider mutations, and deliberate API evolution.

## Implement and verify

Expose a client-safe `public.ts` and a `server.ts` marked `server-only`. Keep queries/repositories,
mappers, service orchestration, typed serializable models, and presentation in their owning feature.
Pages call services directly; retained HTTP routes adapt the same services. Preserve existing access
and cache semantics explicitly. Consume other domains through their deliberate contracts.

Use [Teams](../../../src/features/teams/server/services/team-profile.service.ts) for an example of
injectable service dependencies and mapping, and [Matches](../../../src/features/matches/server.ts)
for a server contract. These examples are not permission to copy their remaining legacy adapters.

Register migrated entry points in [architecture policy](../../../scripts/architecture/policy.json).
Remove obsolete imports only after finding all consumers. Any temporary exception needs an exact
edge, a reason, and a removal condition. Do not weaken checks to make a migration pass.

Test real boundary behavior: invalid input, not found, empty data, identity precedence, errors,
cache headers, and serializable output. Run graph checks and the required full validation. Use
browser fixtures to compare migrated screens at desktop and phone sizes when presentation moves.
Update the ledger with current branch/SHA, remaining adapters, commands and outcomes, and next owner.
