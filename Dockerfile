# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache dumb-init
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
COPY --chown=node:node scripts/manual-test-fixtures ./scripts/manual-test-fixtures
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/cache-gateway-entrypoint
RUN chmod +x /usr/local/bin/cache-gateway-entrypoint && chown -R node:node /app
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "cache-gateway-entrypoint"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "if ((process.env.APP_ROLE ?? 'server') !== 'server') process.exit(0); fetch('http://127.0.0.1:' + (process.env.PORT ?? '3000') + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
