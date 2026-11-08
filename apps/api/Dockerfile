# Build from the repo root: docker build -f apps/api/Dockerfile -t africahr-api .
# Two stages: the first has the full Nx workspace and devDependencies (needed
# to run the Prisma generator and the webpack build); the second is a slim
# runtime image with only what main.js actually needs at boot.

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generates the schema-specific client into node_modules/@prisma/client and
# node_modules/.prisma/client — copied into the runtime stage below since a
# fresh `npm ci` there only installs the generic package, not this generated
# code (see RLS_CONVENTION.md for why the client is schema-specific at all).
RUN npx prisma generate
RUN npx nx run api:build:production

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma's query engine binary is dynamically linked against OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist/apps/api/package.json ./
COPY --from=build /app/dist/apps/api/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist/apps/api/main.js ./

# main.js itself only needs the generated @prisma/client above - the CLI,
# config, and schema/migrations below exist purely so `docker compose run
# --rm api npx prisma migrate deploy` can run directly against this image
# at deploy time instead of needing a one-off build-stage image.
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/libs/platform/database/prisma ./libs/platform/database/prisma
RUN npm install --no-save prisma@^7.8.0 dotenv@^17.4.2

EXPOSE 3000
CMD ["node", "main.js"]
