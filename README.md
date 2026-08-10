# Biwenger Stats

Analytics, market intelligence, live scoring, and fantasy-management tools for private Biwenger
EuroLeague competitions.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

## What it provides

- A personal dashboard with squad, captain, schedule, form, and market signals.
- League standings, round history, comparisons, and advanced performance metrics.
- Squad management and market actions backed by transfer and valuation history.
- Player and team profiles, tournaments, predictions, and live match views.
- A configurable AI assistant and the Hoopgrid EuroLeague trivia game.
- A guarded, idempotent synchronization pipeline for Biwenger and EuroLeague data.

The application is a private authenticated tool. Most views depend on a configured Biwenger league
and synchronized PostgreSQL data.

## Quick start

Requirements: Node.js 20+, npm, PostgreSQL 16, and valid Biwenger credentials.

```bash
npm ci
npm run setup
npm run dev
```

The setup wizard creates a local `.env`; alternatively, copy `.env.example` and configure it
manually. Start PostgreSQL locally or with Docker before running database-backed features. Populate
the application with the guarded sync command described in the documentation.

For complete instructions, read [local development](docs/getting-started/local-development.md) and
[configuration](docs/getting-started/configuration.md). Never commit `.env` files or real tokens.

## Common checks

```bash
npm run lint
npm run typecheck
npm run test:run
SKIP_DB=true npm run build
```

## Technology

The application uses Next.js 16 and React 19, PostgreSQL with Drizzle ORM, Auth.js v5, Tailwind CSS
v4, Vitest, and Playwright. Server-side application code is primarily TypeScript while much of the
UI remains JavaScript as part of a boundary-first migration strategy.

## Documentation

[`docs/`](docs/README.md) is the canonical project knowledge base and can be opened directly as an
Obsidian vault. It includes separate paths for product behavior, architecture, operations,
reference material, contributors, and engineering decisions.

Engineering agents should begin with [`.agents/INSTRUCTIONS.md`](.agents/INSTRUCTIONS.md), which
points to the same canonical documentation rather than maintaining a parallel knowledge base.

## Contributing and security

Read the [development workflow](docs/contributing/development-workflow.md) before making changes.
Report security issues privately and never include credentials, production exports, or private
league data in issues or commits.

This project is available under the [MIT License](LICENSE).
