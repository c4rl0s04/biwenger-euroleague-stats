FROM node:24.20.0-bookworm-slim AS node
FROM mcr.microsoft.com/playwright:v1.58.2-noble
COPY --from=node /usr/local/ /usr/local/
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-16 && rm -rf /var/lib/apt/lists/*
ENV PG_BINDIR=/usr/lib/postgresql/16/bin
WORKDIR /workspace
COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN chown pwuser:pwuser /workspace
USER pwuser
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY --chown=pwuser:pwuser . .
ENTRYPOINT ["node", "scripts/e2e/run.mjs"]
