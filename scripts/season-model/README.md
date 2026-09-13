# Local schema rehearsal

Not a deployable migration. Do not run against Supabase or register this SQL in the
Drizzle journal. Source schema/metadata integration remains a separate unfinished step.

`prepare-copy.sql` was applied only to `season_audit` in the network-isolated
`biwenger-season-audit-20260913` container. It adds seasonal player position/jersey
snapshots and 20 team-season snapshots from the audited 2025-26 copy. Provenance
identifies these as legacy snapshot observations, not verified effective-date history.
No source columns, disputed totals, orphan records or provider mapping records are removed.
No new-season snapshots are inferred from historical identities.

Verification on 2026-09-13:

- Applied transactionally with ON_ERROR_STOP: pass; 366 player snapshots and 20 teams.
- Repeated application: pass; zero backfill updates/inserts.
- Restored the pre-change local dump into `season_audit_before_model`: pass.
- Compared all 38 original public tables by count and sorted full-row hash, excluding
  only the three new player-season columns: no differences.
- `git diff --check`: pass.

Restore artifact: `/tmp/season-audit-before-model.dump` inside the dedicated container.
The restored `season_audit_before_model` database is the verified local rollback baseline.
Keep it untouched. Production backups remain outside Git as recorded in the copy receipt.

Remaining: reconcile disputed history; finalize availability/precision storage; decide
membership-history evidence; integrate schema.ts and generated metadata; add negative,
cross-season and migration tests; rehearse deployment/rollback in a Supabase-compatible
environment. Application build/typecheck/full tests were not run for this SQL-only
experiment. Synchronization, services, UI, production and main remain unchanged.
