# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.3.0] — 2026-02-21

### Added

- **TypeScript migration** — API layer (`src/app/api/**`) and all utility files (`src/lib/utils/`) migrated to TypeScript with full type annotations
- **`docs/TECH_STACK.md`** — Deep-dive documentation on every technology choice
- **`docs/PATTERNS.md`** — Engineering patterns & methodologies reference
- **`docs/ARCHITECTURE.md`** — Updated with Mermaid request lifecycle diagram
- **GitHub Issue & PR templates** — Structured templates for bug reports, feature requests, and pull requests
- **`SECURITY.md`** — Responsible disclosure policy
- **`CHANGELOG.md`** — This file
- **`.github/dependabot.yml`** — Automated dependency update PRs
- **`CODE_OF_CONDUCT.md`** — Contributor covenant

### Changed

- **`middleware.js` → `proxy.js`** — Migrated to Next.js 16 proxy convention
- **`vitest.config.js` → `vitest.config.ts`** — Config file converted to TypeScript
- **CI format check** — Extended Prettier check to cover `.ts` and `.tsx` files
- **CI pipeline** — Added `tsc --noEmit` type check step
- Integration tests relocated from `src/app/api/__tests__/` to root `__tests__/`
- Debug scripts moved from `scripts/` to `scripts/dev/`

### Removed

- `src/components/ui/SnowfallEffect.js` — Snow effect removed
- `react-snowfall` dependency uninstalled
- `jsconfig.json` — Redundant alongside `tsconfig.json`
- `server.log` — Runtime log removed from repository

### Fixed

- React hydration error in `PredictableTeamsCard` (JSX comment in invalid position)
- `allowedDevOrigins` in `next.config.mjs` — removed port numbers (Next.js expects hostnames only)

---

## [1.2.0] — 2026-02-10

### Added

- Tournament bracket visualisation with round selector
- Player sort filters: "Best Match" / "Worst Match" by fantasy points
- Ghost player handling in Ideal Lineup calculation
- Social share metadata (`metadataBase`) for Vercel deployment

### Changed

- Market Trends Chart redesigned with time period selector (1W, 1M, 3M, 6M, 1Y)
- "Hitos Históricos" section restructured into narrative episodes (Los Titanes, Los Visionarios, La Batalla)
- News banner logic — future matches (0-0) excluded from completed results

### Fixed

- Efficiency rating exceeding 100% when ghost players present
- Player image fallback for 403/404 CDN responses

---

## [1.1.0] — 2026-02-03

### Added

- Command palette (⌘K) global search
- Head-to-head Compare page
- Advanced standings stats: Volatility, Heat Check, All-Play-All, Dominance, Floor/Ceiling, Rivalry Matrix
- Market milestone cards ("Hitos Históricos")
- `PlayerImage` component with graceful image fallback

### Changed

- Upgraded to Next.js 16 (App Router)
- PostgreSQL queries migrated to Drizzle ORM
- Services and DB layer migrated to TypeScript
- Docker setup updated for Node 20

---

## [1.0.0] — 2025-10-01

### Added

- Initial release
- Dashboard with KPI cards, squad value, captain stats, ideal lineup
- Full standings with extended metrics
- Market page with transfer history, price trends, best/worst flips
- Round history and lineup viewer
- Player profile pages
- Schedule and matches pages
- Data sync pipeline (Biwenger + Euroleague APIs)
- Docker + GitHub Actions CI/CD
- Authentication via Auth.js
