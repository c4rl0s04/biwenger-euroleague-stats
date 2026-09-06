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

- Node.js 24.20.0 from [.nvmrc](../../.nvmrc), and npm.
- PostgreSQL 16, either installed locally or provided through Docker.
- A Biwenger bearer token plus league and user identifiers for data synchronization.

Groq or OpenAI credentials are optional and only required for assistant features. Docker Desktop is
optional unless Docker is your chosen PostgreSQL or deployment environment.

For isolated agent work or browser tests with synthetic data, start with
[agent workflow](../contributing/agent-workflow.md); no provider credentials are needed.

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

Open <http://localhost:3000>. The application redirects protected pages to `/login`; use the
credentials for an existing manager account (manager name and account password).

To start the local database, app, and background sync containers instead, follow the
[Docker runbook](../operations/docker.md).

## Load data

Synchronization mutates the configured database and is season-guarded. Do not run it until the
database target and active season have been verified. Follow the [data sync runbook](../operations/data-sync.md)
rather than invoking source files directly.

## Verify a change

```bash
npm run verify
```

Database-backed tests are optional and must use a disposable local database unless an explicit
remote-test override is deliberately supplied. See [testing](../contributing/testing.md) for test
locations and safety rules.
