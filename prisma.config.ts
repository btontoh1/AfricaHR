import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'libs/platform/database/prisma/schema.prisma',
  migrations: {
    path: 'libs/platform/database/prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
