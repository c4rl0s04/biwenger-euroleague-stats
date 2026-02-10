# 🐳 Docker Setup & Deployment Guide

This guide explains how to run **Biwenger Stats** using Docker. This is the recommended way to deploy the application as it ensures a consistent environment for the database, application, and background workers.

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Access to the command line (Terminal/PowerShell).

## 🚀 Quick Start

1.  **Configure Environment**
    Ensure you have a `.env` file in the project root (copied from `.env.example`).

    ```bash
    cp .env.example .env
    # Edit .env and fill in your BIWENGER_TOKEN and other credentials
    ```

    > **Important**: The Docker container needs `BIWENGER_TOKEN`, `BIWENGER_LEAGUE_ID`, and `BIWENGER_USER_ID` to function.

2.  **Start the Application**
    Run the following command in the project root:

    ```bash
    docker-compose up -d --build
    ```

    - `-d`: Detached mode (runs in the background).
    - `--build`: Forces a rebuild of the images (useful if you changed code).

3.  **Access the App**
    Open your browser to: [http://localhost:3000](http://localhost:3000)

4.  **View Logs**
    To see the logs of all services:
    ```bash
    docker-compose logs -f
    ```

## 🏗️ Architecture

The `docker-compose.yml` file defines three services that work together:

### 1. `postgres` (Database)

- **Image**: `pgvector/pgvector:pg16` (Official PostgreSQL with vector support).
- **Role**: Stores all application data (players, stats, user data).
- **Persistence**: Data is saved in a named volume `postgres_data`, so it survives container restarts.

### 2. `app` (Web Server)

- **Image**: Built from our `Dockerfile`.
- **Role**: Runs the Next.js web application (`node server.js`).
- **Port**: Exposed on `3000`.
- **Details**: Connects to the `postgres` service to read/write data.

### 3. `sync` (Background Worker)

- **Image**: Reuses the _same image_ as `app`.
- **Role**: Handles data synchronization with the Biwenger and Euroleague APIs.
- **Behavior**:
  - **If `DATABASE_URL` is set**: It detects a remote DB and **does nothing** (sleeps indefinitely) to avoid conflicting with your production syncs.
  - **If `DATABASE_URL` is missing**: It runs a full sync on startup and then loops every 6 hours (daily sync).
- **Why separate?**: Keeps the long-running sync process separate from the web server process.

## 🛠️ Technical Details (Dockerfile)

Our `Dockerfile` uses a **Multi-Stage Build** process to keep the final image extremely small and secure.

1.  **`base`**: Alpine Linux with Node.js 20. Installs system dependencies (python, make, g++) needed for native modules like `better-sqlite3` or `pg`.
2.  **`deps`**: Installs NPM dependencies (`npm ci`).
3.  **`builder`**: Copies the source code and runs `npm run build`.
    - This produces a `.next/standalone` folder, which is a minimized version of the app containing _only_ the necessary files for production.
4.  **`runner`**: The final production image.
    - Runs as a non-root user (`nextjs`) for security.
    - Copies only the `standalone` folder and `public` assets.
    - Result: A lightweight, secure image ready for production.

## ❓ Troubleshooting

### "Role does not exist"

If you see database errors about missing roles, the database might not have initialized correctly.
**Fix**: Stop containers and remove the volume to start fresh (WARNING: Deletes all data).

```bash
docker-compose down -v
docker-compose up -d
```

### "Standalone folder missing"

If the build fails copying `.next/standalone`, ensure your `next.config.mjs` has:

```javascript
output: 'standalone',
```

This is required for the Docker build to work.

## 🛑 Stopping the App

To stop the containers:

```bash
docker-compose down
```

To stop and remove data (clean slate):

```bash
docker-compose down -v
```

## ☁️ Using a Remote Database

You can connect the Docker container to a remote PostgreSQL database (e.g., AWS RDS, Supabase, Neon).

**Option 1: Using DATABASE_URL (Recommended for Supabase)**
If you set `DATABASE_URL` in your `.env` file, it will take precedence over all other connection settings.

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]"
```

**Option 2: Using Individual Variables**
If `DATABASE_URL` is not set, you can use individual variables:

1.  **Update `.env`**:
    Add the `DOCKER_POSTGRES_HOST` variable to your `.env` file pointing to your remote database cloud host.

    ```bash
    DOCKER_POSTGRES_HOST=db.your-project.supabase.co
    POSTGRES_USER=your_user
    POSTGRES_PASSWORD=your_password
    POSTGRES_DB=postgres
    ```

2.  **Run Docker**:
    ```bash
    docker-compose up -d
    ```
    The application will now connect to the remote database. The local `postgres` container defined in `docker-compose.yml` will still start (unless you verify otherwise), but the app will ignore it.
