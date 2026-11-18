---
title: Local Development
description: Configure a local database, load a league, and sign in to Biwenger Stats.
audience:
  - newcomer
  - contributor
status: active
---

# Local development

Use Node.js from [.nvmrc](../../.nvmrc), npm, and a dedicated local PostgreSQL 16 database.
A real league requires a Biwenger bearer token, league ID, and user ID. To develop without real
credentials or league data, use the [disposable authenticated browser environment](../contributing/testing.md#browser-verification).

## 1. Install and configure

```bash
npm ci
npm run setup
```

The wizard validates Biwenger credentials, selects a league, generates `AUTH_SECRET`, and writes
`.env`. Alternatively, copy `.env.example` to `.env` and follow the [configuration guide](configuration.md).
Start your local database and verify that the connection targets it before running any commands
that write data. Keep `.env` and all credentials outside Git.

## 2. Prepare the database and load the league

```bash
npm run db:migrate
npm run db:validate
npm run db:check
```

Confirm that the configured sync season exists, is active, and is bound to your league.
Use the [season lifecycle guide](../operations/season-lifecycle.md) to prepare the season if needed.
Follow the [sync preflight](../operations/data-sync.md#preflight), then run the initial load:

```bash
npm run sync:bootstrap
```

Check that the sync completed and that the intended manager appears in the loaded league. The
[Docker runbook](../operations/docker.md) covers the Compose alternative.

## 3. Provision the first login and start the app

The [membership sync](../../src/lib/sync/services/biwenger/users.ts) creates manager records.
The setup wizard's `ACCESS_PASSWORD` is separate from the per-manager bcrypt hash used by
Auth.js. The repository currently has no interactive first-account provisioning command.
For a fresh database, an authorized maintainer must generate a bcrypt hash locally and provision
it in `users.password` for the synchronized manager's exact ID. Confirm the local database and
manager ID first and preserve any existing hash. Store only the hash in PostgreSQL and provide
the password privately to the manager. See [authentication and security](../architecture/authentication-and-security.md).

```bash
npm run dev
```

Open <http://localhost:3000>, sign in with the synchronized manager's exact name and provisioned
password, and confirm the dashboard shows the expected league data. If login or data is missing,
see [troubleshooting](../operations/troubleshooting.md).

For development changes, run the [focused checks](../contributing/testing.md) for the affected area.
