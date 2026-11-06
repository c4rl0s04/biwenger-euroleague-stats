---
title: Configuration cutover
description: Names-only deployment checklist and rollback gates for simplified configuration.
audience:
  - operator
  - maintainer
  - agent
status: draft
---

# Configuration cutover

This checklist is a release gate, not evidence that production settings were changed. No live
configuration values are recorded here. Use [database safety](database-safety.md),
[season lifecycle](season-lifecycle.md), and [credential encryption](credential-encryption.md).

## Before releasing

- [ ] Back up the target database and verify its season records: exactly one active season, valid
      league binding, official code, start date and sync-enabled state.
- [ ] Provision `DATABASE_URL` for web hosting, sync/live/bootstrap jobs, official enrichment,
      manager-cash and simulations. Keep `PGOPTIONS` read-only protections for finance.
- [ ] Preserve `AUTH_SECRET`, all existing encryption keys and the active key ID. Do not generate
      replacements merely because setup changed.
- [ ] Copy the previous private-bidding allowed account (`BIWENGER_USER_ID`) into
      `PERSONAL_BIDS_USER_ID` on the web runtime. This value is not ingestion identity.
- [ ] Preserve the selected AI provider and model by supplying explicit `AI_PROVIDER`, its matching
      existing key and optional `AI_MODEL`. Compatibility aliases remain until this is confirmed.
- [ ] Confirm public/server Sentry destinations; browser reporting needs the public DSN.
- [ ] For Docker, use a container-reachable URL and the existing local volume's initialization
      settings. Never replace an existing volume/password as a configuration repair.
- [ ] Review migration `0021_explicit_season_writes.sql`: it drops defaults only, with no data edits.
      Apply it to production only after approved backups, caller audit and migration preview.
      Application writes already provide explicit seasons and can run against old defaults during
      the code-first rollout. Never rewrite historical migrations or season identifiers.

## Release checks

- [ ] CI passes for the exact candidate commit.
- [ ] Verify login, current/historical reads, season labels, linked-account state and private bidding
      denial/allowlist behavior. Real provider mutations require separate explicit authorization.
- [ ] Confirm sync preflight and intended provider membership before enabling scheduled ingestion.
- [ ] Verify database/CLI/Drizzle agree on the target and monitoring redacts credentials.
- [ ] Keep retired hosted settings until the previous release is no longer the rollback target.

## Retirement and rollback

Old runtime season settings and split application database settings are not consumed by the new
code. Delete their hosted copies only after the cutover is verified. Remove AI model aliases and
implicit provider selection in a follow-up after all runtimes have explicit matching settings;
never silently switch providers/models during that removal.

Rollback before migration 0021 needs the previous code and its previous deployment settings.
Rollback after 0021 additionally requires auditing previous writers: old code that omits a season
will fail. Prefer reverting code only when explicit writers remain compatible; otherwise prepare
and approve a migration restoring exactly the previously recorded defaults before old writers run.
Do not restore a global historical fallback as an application fix. No secret rotation or data
restore is part of this code rollout.
