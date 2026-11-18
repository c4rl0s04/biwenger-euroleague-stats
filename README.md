# Biwenger Stats

![Biwenger Stats — EuroLeague fantasy analytics](docs/_assets/readme-cover.webp)

**A fantasy basketball analytics app for private Biwenger EuroLeague leagues.** Follow your squad,
spot where rivals gain points, and make lineup and market decisions with the league's history and
official match data in one place.

[See the app](#product-tour) · [Explore the stack](#stack-and-data-flow) ·
[How it works](docs/architecture/system-overview.md) · [Documentation](docs/README.md)

## Stack and data flow

[![Architecture diagram showing Biwenger and EuroLeague feeding GitHub Actions, season data stored in Supabase PostgreSQL, and the Next.js app on Vercel serving league managers. Linked account actions go back to Biwenger, the optional assistant uses Groq or OpenAI, and sync and app errors can reach Sentry.](docs/_assets/stack.png)](docs/_assets/stack.png)

| Flow        | What happens                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ingest**  | GitHub Actions pulls fantasy league state from Biwenger and official match and player statistics from EuroLeague. Sync validates the incoming data and writes it to the configured season in PostgreSQL. |
| **Read**    | Next.js on Vercel serves responsive React views. Auth.js handles sign-in and server-side data access feeds the dashboard, standings, and comparisons from PostgreSQL.                                    |
| **Act**     | A linked personal Biwenger account enables lineup updates, bids, and supported market actions. The optional assistant sends league context to the configured Groq or OpenAI provider.                    |
| **Operate** | GitHub Actions runs CI, browser tests, and deployment smoke checks. Sentry receives application and sync errors where configured. Docker Compose provides a local app, database, and sync worker.        |

[Follow a request through the code](docs/architecture/system-overview.md) ·
[Read the sync runbook](docs/operations/data-sync.md)

## Product tour

![Biwenger Stats dashboard on desktop next to a manager comparison on mobile, both using a synthetic league](docs/_assets/product-showcase.webp)

- **Track your season.** See standings, points progression, captain performance, tournaments, and
  head-to-head comparisons.
- **Scout players and matches.** Explore player form, market value, official box scores, and match
  detail.
- **Manage your squad.** Review transfers, ownership, and listings. Link a personal Biwenger account
  to use supported lineup and market actions.
- **Explore the league.** Make season predictions, play Hoopgrid, or ask the optional assistant
  about league data.

[Full desktop dashboard](docs/_assets/dashboard-desktop.png) ·
[Full mobile comparison](docs/_assets/compare-mobile.png) · [Product map](docs/product/README.md)

## Explore the repository

- [Documentation index](docs/README.md) — architecture, operations, and contracts.
- [Local development](docs/getting-started/local-development.md) — prerequisites, database setup,
  and first login.
- [Contributing](docs/contributing/README.md) — workflow and checks. Coding agents start with
  [AGENTS.md](AGENTS.md).

Report security issues privately. Keep credentials and private league data out of issues and commits.

[MIT License](LICENSE)
