import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'libs/platform/database/prisma/schema.prisma',
  migrations: {
    path: 'libs/platform/database/prisma/migrations',
    seed: 'ts-node --transpile-only libs/platform/database/prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
