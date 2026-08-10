---
title: Local Development
description: Steps for running and verifying Biwenger Stats locally.
audience:
  - newcomer
  - contributor
status: active
---

# Local development

## Prerequisites

- Node.js 20 or newer and npm.
- PostgreSQL 16, either installed locally or provided through Docker.
- A Biwenger bearer token plus league and user identifiers for data synchronization.

Groq or OpenAI credentials are optional and only required for assistant features. Docker Desktop is
optional unless Docker is your chosen PostgreSQL or deployment environment.

## Install and configure

```bash
npm ci
npm run setup
```

The interactive setup validates Biwenger credentials, selects a league, generates `AUTH_SECRET`, and
writes `.env`. To configure manually instead, copy `.env.example` to `.env` and follow the
[configuration reference](configuration.md).

Never commit `.env`. Both `.env` and `.env.local` are intended for local secrets and are ignored by
Git.

## Start the application

With an accessible PostgreSQL database:

```bash
npm run dev
```

Open <http://localhost:3000>. The application redirects protected pages to `/login`; use the access
password configured for your environment.

To start the local database, app, and background sync containers instead, follow the
[Docker runbook](../operations/docker.md).

## Load data

Synchronization mutates the configured database and is season-guarded. Do not run it until the
database target and active season have been verified. Follow the [data sync runbook](../operations/data-sync.md)
rather than invoking source files directly.

## Verify a change

```bash
npm run lint
npm run typecheck
npm run test:run
SKIP_DB=true npm run build
```

Database-backed tests are optional and must use a disposable local database unless an explicit
remote-test override is deliberately supplied. See [testing](../contributing/testing.md) for test
locations and safety rules.
