# Build from the repo root: docker build -f apps/web/Dockerfile -t africahr-web .
# Relies on next.config.js's `output: 'standalone'` — Next traces only the
# node_modules the server actually needs into .next/standalone, which is why
# this can copy just that folder instead of the whole workspace.

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx build web

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
