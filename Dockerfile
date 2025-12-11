# STAGE 1: Base (Dependencies for native modules)
FROM node:20-alpine AS base
# Install dependencies only when needed
RUN apk add --no-cache libc6-compat python3 make g++

# STAGE 2: Dependencies (Install node_modules)
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (ci matches lockfile exactly)
# We need to install everything (including devDependencies) to run build
RUN npm ci

# STAGE 3: Builder (Build the application)
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# STAGE 4: Runner (Production Image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory with correct permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy necessary files
# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output (this includes necessary node_modules)
# Note: Next.js standalone includes production dependencies, but native modules 
# like better-sqlite3 sometimes need their .node bindings or to be re-installed.
# The base image has python/make/g++ so we are safe if we need to rebuild, 
# but usually standalone works if architecture matches.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# COPY SCRIPTS AND SRC for 'npm run sync' support
# The sync script needs:
# 1. scripts/ folder
# 2. src/lib/ folder (imported by scripts)
# 3. package.json (imported by scripts sometimes, or for npm run)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
