# 🏀 BiwengerStats - Next.js Version

> Modern React dashboard for BiwengerLeague statistics - Built with Next.js 15

This project is a comprehensive dashboard for Biwenger fantasy leagues. It includes a fully autonomous data synchronization system built with Node.js, removing the dependency on external Python scrapers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Biwenger Account Credentials (Token, League ID)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:
   Copy `.env.example` to `.env.local` and fill in your details:

```bash
cp .env.example .env.local
```

3. Run the initial data sync:

```bash
npm run sync
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📂 Project Structure

```
biwengerstats-next/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # Reusable React components
│   └── lib/                    # Utilities & Core Logic
│       ├── biwenger-client.js  # API Client
│       ├── config.js           # Centralized Configuration
│       ├── database.js         # SQLite Access
│       └── sync/               # Synchronization Modules
│           ├── sync-players.js
│           ├── sync-standings.js
│           ├── sync-transfers.js
│           ├── sync-matches.js
│           └── sync-lineups.js
├── scripts/
│   └── sync-data.mjs           # Main Sync Orchestrator
├── data/                       # SQLite database (local.db)
└── public/                     # Static assets
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15 (App Router)**: Framework for server-side rendering and routing.
- **React 19**: UI library for building interactive components.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **Chart.js + react-chartjs-2**: For visualizing stats and trends.

### Backend & Data

- **Node.js**: Runtime for the synchronization engine.
- **SQLite (better-sqlite3)**: Fast, serverless, local database for storing stats.
- **Biwenger API**: External source of truth for all data.

### Testing & Quality

- **Vitest**: Blazing fast unit test runner (compatible with Jest).
- **ESLint**: Linter for code quality and consistency.

## 🔄 Data Synchronization

The project includes a robust synchronization system that fetches data directly from the Biwenger API.

To run the sync manually:

```bash
npm run sync
```

This process:

1.  **Players**: Updates player database and market values.
2.  **Standings**: Updates user list.
3.  **Transfers**: Incrementally syncs market transfers.
4.  **Matches**: Updates calendar and match results.
5.  **Lineups**: Syncs user lineups and points for finished rounds.

## 👤 Author

**Carlos Andrés Huete**

- GitHub: [@c4rl0s04](https://github.com/c4rl0s04)

---

Made with ❤️ while learning React and Next.js
