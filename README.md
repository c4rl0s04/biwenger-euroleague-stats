# 🏀 Biwenger Stats - Euroleague Analytics

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **Advanced financial analytics and performance tracking for Biwenger Euroleague fantasy managers.**

---

## 📸 Screeenshot

<div align="center">
  <img src="./public/assets/home.png" width="45%" alt="Home Page" />
  <img src="./public/assets/dashboard.png" width="45%" alt="Dashboard" />
</div>

## 🚀 Overview

**Biwenger Stats** is a powerful companion app for fantasy basketball managers. It synchronizes data from Biwenger and Euroleague APIs to provide deep insights that the native platform misses. From identifying undervalued players ("Sniper Mode") to tracking your exact profit on every trade, this tool gives you the data-driven edge to win your league.

## ✨ Key Features

### 📊 Dashboard & Analytics

- **Live Scoring**: Real-time fantasy points updates during Euroleague games.
- **Squad Value Tracking**: Visualize your team's financial growth over the season.
- **Ideal Lineup**: Algorithm that calculates the maximum possible score for every round.

### 💰 Market Intelligence

- **Sniper Mode**: Identify undervalued players currently on the market.
- **Trade Analysis**: Track your best and worst transfers by profit margin.
- **Price Trends**: Interactive charts showing player value history (1W, 1M, Season).
- **Big Spender**: See who is investing the most cash in the market.

### 🏆 Tournaments

- **Custom Brackets**: Support for Cup/Playoff formats alongside the regular league.
- **Head-to-Head**: Direct comparison tools for player vs. player stats.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (via `pg`)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts & Chart.js
- **Validation**: Zod
- **Testing**: Vitest

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/biwengerstats-next.git
    cd biwengerstats-next
    ```

2.  **Configure Environment**

    **🎯 Recommended: Use the Setup Wizard**

    Run the interactive setup wizard to automatically configure your credentials:

    ```bash
    npm run setup
    ```

    The wizard will:
    1. Ask you to paste your Biwenger token (from browser Developer Tools)
    2. Automatically fetch all your leagues and let you select one
    3. Extract your League ID and User ID automatically
    4. Prompt you to set an admin password
    5. Auto-generate a secure session encryption key
    6. Create your `.env` file with all required configuration

    **That's it!** No manual JSON inspection needed.

    <details>
    <summary><strong>Advanced: Manual Configuration</strong></summary>

    If you prefer to configure manually, copy the example environment file:

    ```bash
    cp .env.example .env
    ```

    Then open `.env` and fill in the following **required** credentials:

    ### Required Credentials

    #### `BIWENGER_TOKEN`

    Your personal authentication token from Biwenger.

    **How to get it:**
    1. Log into [Biwenger](https://biwenger.as.com) in your browser
    2. Open Developer Tools (F12)
    3. Go to the **Network** tab
    4. Refresh the page
    5. Look for a request to `https://biwenger.as.com/api/v2/`
    6. In the **Headers** section, find `Authorization: Bearer <YOUR_TOKEN>`
    7. Copy the token (everything after `Bearer `)

    #### `BIWENGER_LEAGUE_ID`

    Your league's unique identifier.

    **How to get it:**
    1. In Developer Tools (Network tab), look for a request to `/api/v2/league`
    2. Click on the request and go to the **Response** or **Preview** tab
    3. Find the `id` field in the JSON response
    4. Copy that number as your `BIWENGER_LEAGUE_ID`

    #### `BIWENGER_USER_ID`

    Your user ID within Biwenger.

    **How to get it:**
    1. In Developer Tools (Network tab), look for a request to `/api/v2/user`
    2. Click on the request and go to the **Response** or **Preview** tab
    3. Find the `id` field in the JSON response
    4. Copy that number as your `BIWENGER_USER_ID`

    #### `ACCESS_PASSWORD`

    A password you create to protect the admin/sync dashboard.

    **How to set it:**
    - Choose any secure password (e.g., `"mySecretPassword123"`)

    #### `AUTH_SECRET`

    A random string for encrypting user sessions.

    **How to generate it:**

    ```bash
    openssl rand -base64 32
    ```

    Copy the output into your `.env` file.

    ### Optional: Remote Database

    By default, Docker creates a local PostgreSQL database. To use **Supabase** or another remote database:

    ```bash
    DATABASE_URL="postgresql://user:password@host:port/database"
    ```

    </details>

3.  **Run with Docker**

    ```bash
    docker-compose up -d
    ```

4.  **Access the App**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 Data Synchronization

The app uses a robust ETL pipeline to keep data fresh.

- **Full Sync**: `npm run sync` (Updates players, market, and stats)
- **Live Sync**: `npm run sync:live` (Fast updates for live games)
- **Daily Sync**: `npm run sync:daily` (Scheduled maintenance)

See [DATA_SYNC.md](./docs/DATA_SYNC.md) for details.

## 📚 Documentation

- [Features Guide](./docs/FEATURES.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API_INTEGRATION.md)

## 🤝 Contributing

Contributions are welcome! Please run the test suite before submitting a PR:

```bash
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
