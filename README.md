<div align="center">
  <img src="public/icons/icon-192.png" width="72" height="72" alt="" />
  <h1>Biwenger Stats</h1>
  <p><strong>See where your EuroLeague fantasy season is won.</strong></p>
  <p>Follow your squad, find the rounds that put a rival ahead, and see how the market is moving.<br />Built for private Biwenger leagues, with official EuroLeague stats and your league’s own history.</p>
  <p><a href="#product-tour">Product tour</a> · <a href="#how-the-stack-fits-together">Architecture</a> · <a href="docs/README.md">Documentation</a></p>
</div>

[![Biwenger Stats dashboard with season points, squad value, captain performance, and recent rounds](docs/_assets/dashboard-desktop.png)](docs/_assets/dashboard-desktop.png)

## Product tour

### Catch up on your league on mobile

Open Home to see your league position, points, squad value, and recent activity.

<p align="center">
  <img src="docs/_assets/home-mobile.png" width="340" alt="Full mobile Home screen with league position, squad value, recent activity, and the bottom navigation" />
</p>

### See what the market is doing

Switch between time windows to see transfer volume. Review player values and recent activity
before making a move with a linked Biwenger account.

[![Market volume chart with selectable time windows and a 90-day total](docs/_assets/market-trends.webp)](docs/_assets/market-trends.webp)

_The market chart uses synthetic league data._ [Explore all features](docs/product/README.md)

## How the stack fits together

<picture>
  <source media="(max-width: 650px)" srcset="docs/_assets/stack-mobile.png" />
  <img src="docs/_assets/stack.png" alt="Two system flows. Biwenger and EuroLeague data enter GitHub Actions, which validates and stores season data in Supabase PostgreSQL for the Next.js app on Vercel. A manager’s bid goes through the authenticated Next.js server back to Biwenger using linked account credentials. Groq or OpenAI, Sentry, and Docker Compose support the app." />
</picture>

[Open full-size diagram](docs/_assets/stack.png) ·
[Read the architecture walkthrough](docs/architecture/system-overview.md)

## Explore the repository

- [Product map](docs/product/README.md) — features, screens, and their implementation.
- [Local development](docs/getting-started/local-development.md) — setup, startup, and first login.
- [Operations](docs/operations/README.md) — sync, deployment, and recovery.
- [MIT License](LICENSE)
