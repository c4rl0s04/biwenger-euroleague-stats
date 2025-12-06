# 🏀 BiwengerStats

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> 📊 Modern dashboard for Biwenger Euroleague fantasy basketball statistics

<p align="center">
  <img src="docs/screenshots/dashboard-preview.png" alt="Dashboard Preview" width="800">
</p>

## ✨ Features

- 🏆 **Live Standings** - Real-time league leaderboard with point gaps
- 📈 **Player Analytics** - Top performers, form streaks, rising stars
- 💰 **Market Tracking** - Latest transfers and player movements
- 🎯 **Captain Insights** - Track your captain picks performance
- 🏠 **Home/Away Stats** - Compare performance by venue
- 🎂 **Birthday Tracker** - See which players celebrate today
- 🔥 **Hot & Cold Streaks** - Identify in-form and struggling players
- 🏅 **Weekly MVPs** - Celebrate last round's top performers

## 🖼️ Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Dashboard Overview

<!-- Add your screenshot here -->

![Dashboard](docs/screenshots/dashboard.png)

### Player Statistics

<!-- Add your screenshot here -->

![Players](docs/screenshots/players.png)

### Market Activity

<!-- Add your screenshot here -->

![Market](docs/screenshots/market.png)

</details>

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/c4rl0s04/biwengerstats-next.git
cd biwengerstats-next

# Configure credentials
cp .env.example .env.local
# Edit .env.local with your Biwenger token

# Run with Docker
docker-compose up -d

# Open http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Sync data from Biwenger
npm run sync

# Start dev server
npm run dev
```

## 🔑 Getting Your Biwenger Credentials

1. Log into [Biwenger](https://biwenger.as.com) in your browser
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Click any option in Biwenger
5. Find a request and copy the `Authorization` header value
6. Copy your `X-League` header for your League ID

<details>
<summary>📸 Visual Guide</summary>

![How to get token](docs/screenshots/get-token.png)

</details>

## 📂 Project Structure

```
biwengerstats-next/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/              # Core utilities
│       ├── database.js   # SQLite queries
│       └── sync/         # Data sync modules
├── scripts/              # CLI scripts
├── data/                 # SQLite database
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

| Category   | Technology                 |
| ---------- | -------------------------- |
| Framework  | Next.js 16 (App Router)    |
| UI         | React 19 + Tailwind CSS 4  |
| Database   | SQLite (better-sqlite3)    |
| Charts     | Chart.js + react-chartjs-2 |
| Icons      | Lucide React               |
| Testing    | Vitest                     |
| Deployment | Docker                     |

## 🔄 Data Synchronization

Sync your league data from the Biwenger API:

```bash
# Local
npm run sync

# Docker
docker-compose exec web npm run sync
```

This fetches:

- ✅ Players & market values
- ✅ User standings
- ✅ Transfers & bids
- ✅ Match results
- ✅ Lineups & captain picks

## 🐳 Docker Deployment

See [DOCKER.md](DOCKER.md) for detailed deployment instructions.

```bash
# Quick start
docker-compose up -d

# View logs
docker-compose logs -f

# Update
docker-compose pull && docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Carlos Andrés Huete**

- GitHub: [@c4rl0s04](https://github.com/c4rl0s04)

---

<p align="center">
  Made with ❤️ for the Biwenger community
</p>

<p align="center">
  <a href="#-biwengerstats">Back to top ↑</a>
</p>
