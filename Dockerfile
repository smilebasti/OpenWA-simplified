# OpenWA - Dockerfile
# Multi-stage build: Alpine base keeps the image lean

# ===== Stage 1: Builder =====
FROM node:22-alpine AS builder

WORKDIR /app

# Native addon compilation (sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Full install — builds sqlite3 native bindings
RUN npm ci

COPY . .
RUN npm run build

# Strip devDependencies so production stage can copy node_modules directly
RUN npm prune --omit=dev

# ===== Stage 2: Production =====
FROM node:22-alpine AS production

# Chromium + minimal runtime libs for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN addgroup -S openwa && adduser -S -G openwa openwa

WORKDIR /app

# Copy pruned node_modules (sqlite3 already compiled) and built app
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
