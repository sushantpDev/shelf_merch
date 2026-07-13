# Build/runtime image for @shelfmerch/api. The same image runs both the HTTP
# API (default CMD) and the BullMQ worker (command overridden in the stack file).
# Build context is the repo ROOT so the workspace lockfile resolves:
#   docker build -f apps/api/Dockerfile -t shelfmerch/api:latest .

# ---- deps: install production dependencies for the workspace ----
FROM node:20-alpine AS deps
WORKDIR /app
# Workspace install needs the root manifest + every workspace's package.json.
# .npmrc carries legacy-peer-deps=true (see repo root) so `npm ci` resolves the
# tree the same way CI does.
COPY .npmrc package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --ignore-scripts

# ---- runtime: minimal, non-root ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
# Local-storage fallback dir must be writable by the app user.
RUN mkdir -p apps/api/uploads && chown -R app:app /app
USER app
WORKDIR /app/apps/api
EXPOSE 8080
# Container-level healthcheck (Node 20 has global fetch — no curl needed).
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/v1/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Default: the HTTP API. The worker service overrides this in docker-stack.yml.
CMD ["node", "src/server.js"]
