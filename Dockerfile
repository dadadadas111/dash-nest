# Multi-stage Dockerfile for NestJS

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm install -g pnpm && pnpm run build

# Prune development dependencies to keep the image small
RUN pnpm prune --prod

# ------------------------------------------------------------------------------
# Stage 3: Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nestjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/main"]
