# Docker Deployment Guide

## Quick Start

### 1. Clone and Configure

```bash
git clone <your-repo-url>
cd biwengerstats-next

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 2. Set Environment Variables

Edit `.env.local` with your Biwenger API credentials:

```
BIWENGER_TOKEN=your_bearer_token_here
BIWENGER_LEAGUE_ID=your_league_id_here
BIWENGER_USER_ID=your_user_id_here
```

> **How to get your token**: Open Biwenger in your browser, go to Developer Tools → Network tab, and find the `Authorization` header in any API request.

### 3. Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The app will be available at **http://localhost:3000**

---

## Alternative: Docker Build Only

If you prefer not to use docker-compose:

```bash
# Build the image
docker build -t biwengerstats .

# Run the container
docker run -d \
  --name biwengerstats \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e BIWENGER_TOKEN=your_token \
  -e BIWENGER_LEAGUE_ID=your_league_id \
  -e BIWENGER_USER_ID=your_user_id \
  biwengerstats
```

---

## Data Synchronization

To sync data from the Biwenger API, run:

```bash
# With docker-compose
docker-compose exec web npm run sync

# Or directly
docker exec biwengerstats npm run sync
```

> **Note**: The database is persisted in the `./data` folder, so your data survives container restarts.

---

## Production Deployment

### Deploy to a VPS

1. Install Docker and Docker Compose on your server
2. Clone the repository
3. Configure `.env.local`
4. Run `docker-compose up -d`

### Deploy to Docker Hub

```bash
# Build and tag
docker build -t yourusername/biwengerstats:latest .

# Push to Docker Hub
docker push yourusername/biwengerstats:latest
```

### Environment Variables Summary

| Variable             | Description                | Required |
| -------------------- | -------------------------- | -------- |
| `BIWENGER_TOKEN`     | Bearer token from Biwenger | Yes      |
| `BIWENGER_LEAGUE_ID` | Your league ID             | Yes      |
| `BIWENGER_USER_ID`   | Your user ID               | Optional |

---

## Troubleshooting

### Container won't start

```bash
docker-compose logs web
```

### Database permission issues

```bash
chmod 755 ./data
```

### Rebuild after changes

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
