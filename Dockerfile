# OpenWA - Dockerfile
# Multi-stage build: Alpine base keeps the image lean

# ===== Stage 1: Builder =====
FROM node:24-alpine AS builder

WORKDIR /app

# Native addon compilation (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Full install — builds better-sqlite3 native bindings
RUN npm ci

COPY . .
RUN npm run build

# Strip devDependencies so production stage can copy node_modules directly
RUN npm prune --omit=dev

# ===== Stage 2: Production =====
FROM node:24-alpine AS production

# Chromium from Alpine edge for Puppeteer 24 compatibility (Alpine stable has ~131, edge has ~137)
RUN apk add --no-cache \
    --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN addgroup -S openwa && adduser -S -G openwa openwa

WORKDIR /app

# Copy pruned node_modules (better-sqlite3 already compiled) and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN mkdir -p ./data/sessions ./data/media && \
    chown -R openwa:openwa /app

EXPOSE 2785

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:2785/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
