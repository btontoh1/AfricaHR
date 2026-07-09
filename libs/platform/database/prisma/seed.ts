// Bootstraps the first PLATFORM_ADMIN user. Run directly via Prisma
// (`prisma db seed`), not through the API — creating a platform admin
// through the API would need an existing platform admin to authorize it,
// which is exactly the chicken-and-egg problem this script exists to break.
import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SystemRole } from '@prisma/client';

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to run the seed script');
  }

  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
  const password = process.env['SEED_ADMIN_PASSWORD'];
  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be set (no default — this account has full platform access)',
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      console.log(`Seed: platform admin "${email}" already exists, skipping.`);
      return;
    }

    const passwordHash = await argon2.hash(password);

    await prisma.user.create({
      data: {
        tenantId: null,
        email,
        passwordHash,
        firstName: 'Platform',
        lastName: 'Admin',
        role: SystemRole.PLATFORM_ADMIN,
      },
    });

    console.log(`Seed: created platform admin "${email}".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
