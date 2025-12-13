# Biwenger Stats - Euroleague Analytics

An advanced analytics dashboard for Euroleague fantasy managers on Biwenger. This application synchronizes data directly from Biwenger and provides insights, statistics, and tools to help you win your league.

## Features

-   **Dashboard**: Overview of your team, market trends, and league standings.
-   **Player Analysis**: Detailed stats, hot/cold streaks, and form analysis.
-   **Market Intelligence**: Track price changes, undervalued players, and transfer history.
-   **League Stats**: "Porras" (prediction game) tracking, leader comparisons, and average points.
-   **Tools**: Ideal lineup calculator and captain recommendations.

## Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: JavaScript / Node.js
-   **Database**: SQLite (via `better-sqlite3`)
-   **Styling**: Tailwind CSS
-   **Charts**: Chart.js

## Prerequisites

-   Node.js 18+
-   A generic or public Biwenger account (for tokens)

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/biwengerstats-next.git
    cd biwengerstats-next
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Copy `.env.example` to `.env.local` and fill in your details:
    ```bash
    cp .env.example .env.local
    ```
    
    *   `BIWENGER_TOKEN`: Your Bearer token (inspect network requests on biwenger.com).
    *   `BIWENGER_LEAGUE_ID`: The ID of the league you want to track.
    *   `BIWENGER_USER_ID`: (Optional) Your specific user ID to highlight your team.

4.  **Sync Data**:
    Run the sync script to fetch data from Biwenger and populate the SQLite database.
    ```bash
    npm run sync
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Docker Support

Build and run using Docker:

```bash
docker build -t biwengerstats .
docker run -p 3000:3000 -v $(pwd)/data:/app/data --env-file .env.local biwengerstats
```

## Project Structure

-   `src/app`: Next.js pages and API routes.
-   `src/components`: React components (Cards, Charts, Tables).
-   `src/lib/db`: Database layer (Client, Schema, Queries).
-   `scripts`: Data synchronization scripts.
-   `data`: SQLite database storage (git-ignored).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
