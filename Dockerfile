# Build stage
FROM node:20-alpine AS builder

# Metadata
LABEL org.opencontainers.image.title="BiwengerStats"
LABEL org.opencontainers.image.description="Modern dashboard for Biwenger Euroleague fantasy basketball statistics"
LABEL org.opencontainers.image.authors="Carlos Andrés Huete <github.com/c4rl0s04>"
LABEL org.opencontainers.image.source="https://github.com/c4rl0s04/biwengerstats-next"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.version="1.0.0"

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy everything needed for sync script
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules

# Create data directory and set permissions
RUN mkdir -p ./data && chown -R nextjs:nodejs ./data ./src ./scripts

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
