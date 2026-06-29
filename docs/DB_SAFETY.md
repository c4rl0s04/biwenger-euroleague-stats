# Database Safety

This project treats production fantasy data as non-reconstructable. Schema work must start with audit and backup, not mutation.

## Before Any Migration-Affecting PR

Run and keep the output with the PR notes:

```bash
pg_dump --schema-only "$DATABASE_URL" > schema-backup.sql
pg_dump --data-only "$DATABASE_URL" > data-backup.sql
psql "$DATABASE_URL" -c "select schemaname, relname, n_live_tup from pg_stat_user_tables order by relname;"
cat drizzle/meta/_journal.json
npm run db:audit:schema
```

If you only need to compare `src/lib/db/schema.ts` with committed Drizzle metadata and do not want any database connection:

```bash
npm run db:audit:schema:metadata
```

## Rules

- Do not drop, truncate, rename, or rewrite production tables without an explicit restore plan.
- `npm run db:audit:schema` refuses remote-looking database targets unless `ALLOW_REMOTE_SCHEMA_AUDIT=true` or `--allow-remote` is set after backups are confirmed.
- Keep `ensureSchema()` only as a transitional bootstrap path until source schema, migrations, and production metadata have been audited.
- Prefer additive migrations. Any destructive migration must have a verified backup and a rollback script.
- Optional DB-backed tests must use a disposable local database unless `ALLOW_REMOTE_TEST_DB=true` is explicitly set.

## Player Price Cache Repair

`market_values` is the durable price history and records both increases and decreases. `players.price` is only a latest-price cache for application queries.

To inspect drift without changing data:

```bash
npm run db:repair:player-prices
```

To repair `players.price` from the latest `market_values` row, first create a fresh backup, then run:

```bash
ALLOW_REMOTE_PRICE_REPAIR=true npm run db:repair:player-prices -- --apply
```

The repair updates only `players.price`; it never deletes or rewrites `market_values`.
