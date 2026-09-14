---
title: Season Data Copy Receipt
description: Preparation receipt and execution record for the historical season data copy.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Season data copy — preparation receipt

Date: 2026-09-13. Application base: `354f66e1`.
Worktree: `biwengerstats-next-season-data-model`; branch: `refactor/season-data-model`.

## Completed

- Existing Scheduled Sync and Live Fantasy Sync workflows were already disabled; no workflow state was changed.
- Protected custom-format, schema-only and data-only backups were created outside Git. Archive listing succeeded.
- Restored application schemas `public` and `drizzle` into database `season_audit` in local container `biwenger-season-audit-20260913`.
- Container uses PostgreSQL 17.11, network mode `none`, no published ports, socket-only database access and a dedicated persistent volume of the same name.
- Source server reports PostgreSQL 17.6. The image digest is `sha256:67f41722b7a8cbdb868a44a4995c846eddfdc2973bccb291ce937dce88ad5675`.
- Restore used no-owner/no-privileges, exit-on-error and a single transaction. The destination `drizzle` schema was created explicitly after an initial transactional restore failed because it was absent. The subsequent restore succeeded.
- Only in the copy: nulled account email/password/plaintext provider token, deleted encrypted credentials and Assistant messages/conversations. Verified zero remaining values in those credential fields and zero encrypted credential rows. Login fixtures are not configured yet.
- All 34 non-sanitized public tables matched source counts and full-row fingerprints. Comparison standardized UTC and C collation; an initial comparison without standardized collation produced false differences.
- The copied player-season data contains 366 records for 2025-26, with a points sum of 107279. This is a baseline, not a correctness assertion.

## Limitations and next gate

This is an application-data restore, not a full Supabase disaster-recovery rehearsal. Managed schemas, extensions, roles and grants are not reproduced. Four sanitized tables are excluded from full-row equality. Other historical/source payloads remain private data; do not expose the container or commit exports.

The backup mount is read-only; backups retain their original sensitive contents outside Git. No production mutations, deployments, source schema edits or credential configuration changes occurred.

Next: audit historical ownership/completeness on this copy before implementing schema changes. A full production-compatible restore/rehearsal and a fresh backup remain mandatory before cutover. Do not run routine sync or attach provider credentials to this container.
