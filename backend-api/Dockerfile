# ─────────────────────────────────────────────────────────────────
# Bếp Nhà Mình — Backend Dockerfile
# Multi-stage build: build TypeScript → run compiled JS
# Cache-bust: 2026-05-08 — force rebuild with Phase 2 Prisma schema
# ─────────────────────────────────────────────────────────────────

# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (incl. devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npx prisma generate    # generate Prisma client FIRST (types needed by tsc)
RUN npm run build          # tsc → dist/

# ─── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output + Prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# Create uploads dir (used in dev; prod uses Supabase Storage)
RUN mkdir -p uploads/menu-images

EXPOSE 3001

# Run migrations then start server
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
