---
title: Database Safety
description: Mandatory safeguards for schema work, remote databases, and repair operations.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Database safety

Production fantasy data is non-reconstructable. Schema work starts with audit and backup, not
mutation.

## Before a migration-affecting pull request

Resolve the exact target database, then create and retain:

```bash
pg_dump --schema-only "$DATABASE_URL" > schema-backup.sql
pg_dump --data-only "$DATABASE_URL" > data-backup.sql
psql "$DATABASE_URL" -c "select schemaname, relname, n_live_tup from pg_stat_user_tables order by relname;"
cat drizzle/meta/_journal.json
npm run db:audit:schema
```

Backups contain sensitive data. Store them outside the repository and verify that they are readable.
The schema audit refuses remote-looking targets unless `ALLOW_REMOTE_SCHEMA_AUDIT=true` or
`--allow-remote` is supplied after backups are confirmed.

To compare source schema with committed Drizzle metadata without connecting to a database:

```bash
npm run db:audit:schema:metadata
```

## Rules

- Do not drop, truncate, rename, or rewrite production tables without a tested restore plan.
- Prefer additive migrations and provide rollback steps for destructive changes.
- Treat `ensureSchema()` as transitional local/bootstrap behavior, not a substitute for reviewed
  production migrations.
- Optional database tests must use a disposable local database unless `ALLOW_REMOTE_TEST_DB=true` is
  deliberately set.
- Never commit dumps, credentials, or production row samples.

## Player price cache repair

`market_values` is durable price history; `players.price` is a latest-value cache. Inspect drift
without changing data:

```bash
npm run db:repair:player-prices
```

To apply the repair, first create and verify a fresh backup, then run:

```bash
ALLOW_REMOTE_PRICE_REPAIR=true npm run db:repair:player-prices -- --apply
```

The repair only updates `players.price` from the latest applicable `market_values` row. It does not
delete or rewrite the history table. Review its dry-run output and target before applying it.

## Recovery expectation

Every destructive proposal must state the restore artifact, restoration command, expected downtime,
and verification query before approval. A successful command exit is not sufficient evidence that
historical relationships remain correct; use row counts and domain-level checks.
