// Bootstraps the first PLATFORM_ADMIN user and placeholder payroll
// statutory reference data. Run directly via Prisma (`prisma db seed`),
// not through the API — creating a platform admin through the API would
// need an existing platform admin to authorize it, which is exactly the
// chicken-and-egg problem this script exists to break.
import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, StatutoryRateCode, SystemRole } from '@prisma/client';

async function seedPlatformAdmin(prisma: PrismaClient): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
  const password = process.env['SEED_ADMIN_PASSWORD'];
  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be set (no default — this account has full platform access)',
    );
  }

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
}

/**
 * PLACEHOLDER Ghana PAYE tax bands and SSNIT rates, so a fresh environment
 * has something to compute payroll against end-to-end. These figures are
 * deliberately round numbers, NOT the current GRA/SSNIT published tables —
 * see project memory: statutory tax data is never hardcoded into
 * application logic, and this seed must be replaced with GRA/SSNIT's
 * actual current figures (via the platform-admin-only
 * POST /payroll/statutory/{tax-bands,rates} endpoints) before any real
 * payroll run.
 */
async function seedGhanaStatutoryData(prisma: PrismaClient): Promise<void> {
  const countryCode = 'GH';
  const effectiveFrom = new Date('2026-01-01');

  const existingBands = await prisma.statutoryTaxBand.findFirst({ where: { countryCode } });
  if (existingBands) {
    console.log(`Seed: statutory tax bands for "${countryCode}" already exist, skipping.`);
  } else {
    await prisma.statutoryTaxBand.createMany({
      data: [
        { countryCode, order: 1, lowerBound: 0, upperBound: 500, rate: 0, effectiveFrom },
        { countryCode, order: 2, lowerBound: 500, upperBound: 1000, rate: 0.05, effectiveFrom },
        { countryCode, order: 3, lowerBound: 1000, upperBound: 2000, rate: 0.1, effectiveFrom },
        { countryCode, order: 4, lowerBound: 2000, upperBound: 3000, rate: 0.175, effectiveFrom },
        { countryCode, order: 5, lowerBound: 3000, upperBound: 5000, rate: 0.25, effectiveFrom },
        { countryCode, order: 6, lowerBound: 5000, upperBound: null, rate: 0.3, effectiveFrom },
      ],
    });
    console.log(
      `Seed: created PLACEHOLDER PAYE tax bands for "${countryCode}" — confirm against GRA's current published table before real payroll runs.`,
    );
  }

  const existingRates = await prisma.statutoryRate.findFirst({ where: { countryCode } });
  if (existingRates) {
    console.log(`Seed: statutory rates for "${countryCode}" already exist, skipping.`);
  } else {
    await prisma.statutoryRate.createMany({
      data: [
        {
          countryCode,
          code: StatutoryRateCode.SSNIT_EMPLOYEE,
          rate: 0.055,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.SSNIT_EMPLOYER,
          rate: 0.13,
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created PLACEHOLDER SSNIT rates for "${countryCode}" — confirm against SSNIT's current published rates before real payroll runs.`,
    );
  }
}

/**
 * Nigeria PAYE tax bands and pension contribution rates, converted to the
 * same monthly basis as Ghana's data above (this engine computes tax per
 * pay run, not annually, so the Sixth Schedule's real annual bands —
 * ₦300k/300k/500k/500k/1.6m @ 7/11/15/19/21%, remainder @ 24% — are divided
 * by 12 here rather than re-derived from scratch).
 *
 * Two known gaps, not fixed here:
 * 1. Nigeria's real PAYE first subtracts a Consolidated Relief Allowance
 *    (the higher of ₦200k/yr or 1% of gross income, plus 20% of gross
 *    income) before applying these bands. computePayslip has no such
 *    relief step — it only subtracts the pension contribution before
 *    banding — so PAYE computed here will overstate a Nigerian employee's
 *    real tax liability until CRA support is added to the calculator.
 * 2. StatutoryRateCode's SSNIT_EMPLOYEE/SSNIT_EMPLOYER codes are Ghana's
 *    scheme name (Social Security and National Insurance Trust) reused
 *    here for Nigeria's Pension Reform Act 2014 minimum contribution
 *    (8% employee / 10% employer of basic salary) rather than adding a
 *    generic PENSION_EMPLOYEE/PENSION_EMPLOYER code — a deliberate choice
 *    to avoid renaming the enum/field across the whole payroll module for
 *    a naming-only fix. countryCode already disambiguates which scheme a
 *    row actually represents.
 */
async function seedNigeriaStatutoryData(prisma: PrismaClient): Promise<void> {
  const countryCode = 'NG';
  const effectiveFrom = new Date('2026-01-01');

  const existingBands = await prisma.statutoryTaxBand.findFirst({ where: { countryCode } });
  if (existingBands) {
    console.log(`Seed: statutory tax bands for "${countryCode}" already exist, skipping.`);
  } else {
    const d = (value: string) => new Prisma.Decimal(value);
    await prisma.statutoryTaxBand.createMany({
      data: [
        { countryCode, order: 1, lowerBound: d('0'), upperBound: d('25000'), rate: d('0.07'), effectiveFrom },
        { countryCode, order: 2, lowerBound: d('25000'), upperBound: d('50000'), rate: d('0.11'), effectiveFrom },
        { countryCode, order: 3, lowerBound: d('50000'), upperBound: d('91666.67'), rate: d('0.15'), effectiveFrom },
        { countryCode, order: 4, lowerBound: d('91666.67'), upperBound: d('133333.33'), rate: d('0.19'), effectiveFrom },
        { countryCode, order: 5, lowerBound: d('133333.33'), upperBound: d('266666.67'), rate: d('0.21'), effectiveFrom },
        { countryCode, order: 6, lowerBound: d('266666.67'), upperBound: null, rate: d('0.24'), effectiveFrom },
      ],
    });
    console.log(
      `Seed: created PLACEHOLDER PAYE tax bands for "${countryCode}" (monthly, no CRA relief applied) — confirm against FIRS's current published table before real payroll runs.`,
    );
  }

  const existingRates = await prisma.statutoryRate.findFirst({ where: { countryCode } });
  if (existingRates) {
    console.log(`Seed: statutory rates for "${countryCode}" already exist, skipping.`);
  } else {
    await prisma.statutoryRate.createMany({
      data: [
        {
          countryCode,
          code: StatutoryRateCode.SSNIT_EMPLOYEE,
          rate: 0.08,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.SSNIT_EMPLOYER,
          rate: 0.1,
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created PLACEHOLDER Pension Reform Act rates for "${countryCode}" (stored under the SSNIT_EMPLOYEE/SSNIT_EMPLOYER codes - see this function's doc comment) — confirm against PenCom's current published rates before real payroll runs.`,
    );
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to run the seed script');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    await seedPlatformAdmin(prisma);
    await seedGhanaStatutoryData(prisma);
    await seedNigeriaStatutoryData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
