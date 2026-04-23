# ─────────────────────────────────────────────────────────────────
# Bếp Nhà Mình — Root Dockerfile for Railway monorepo deploy
# Build context = repo root, app source in backend-api/
# ─────────────────────────────────────────────────────────────────

# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (incl. devDeps for build)
COPY backend-api/package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY backend-api/tsconfig.json ./
COPY backend-api/prisma ./prisma/
COPY backend-api/src ./src/

RUN npm run build          # tsc → dist/
RUN npx prisma generate    # generate Prisma client

# ─── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Only production dependencies
COPY backend-api/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output + Prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY backend-api/prisma ./prisma/

# Create uploads dir (used in dev; prod uses Supabase Storage)
RUN mkdir -p uploads/menu-images

EXPOSE 3001

# Run migrations then start server
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
