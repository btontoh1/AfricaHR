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

const d = (value: string) => new Prisma.Decimal(value);

/**
 * Ghana PAYE tax bands and SSNIT rates, effective 1 January 2026 (the GRA's
 * current published annual resident-individual schedule, divided by 12
 * since this engine computes tax per pay run, not annually):
 * 0-5,880 @0%, 5,880-7,200 @5%, 7,200-8,760 @10%, 8,760-46,760 @17.5%,
 * 46,760-238,760 @25%, 238,760-605,000 @30%, 605,000+ @35%. Sourced from
 * public GRA-rate summaries in July 2026 - confirm against the GRA's own
 * gazette before relying on these for real payroll, and re-verify annually
 * since GRA revises bands with the national budget.
 *
 * SSNIT's maximum monthly insurable earnings ceiling (GHS 69,000,
 * confirmed via SSNIT's own public notice, raised from GHS 61,000 for
 * 2026) is enforced in code, not here as data - see
 * applyGhanaInsurableEarningsCap in payroll-domain, since it's a cap on
 * the calculation, not a rate to seed.
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
        { countryCode, order: 1, lowerBound: d('0'), upperBound: d('490'), rate: d('0'), effectiveFrom },
        { countryCode, order: 2, lowerBound: d('490'), upperBound: d('600'), rate: d('0.05'), effectiveFrom },
        { countryCode, order: 3, lowerBound: d('600'), upperBound: d('730'), rate: d('0.1'), effectiveFrom },
        {
          countryCode,
          order: 4,
          lowerBound: d('730'),
          upperBound: d('3896.67'),
          rate: d('0.175'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 5,
          lowerBound: d('3896.67'),
          upperBound: d('19896.67'),
          rate: d('0.25'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 6,
          lowerBound: d('19896.67'),
          upperBound: d('50416.67'),
          rate: d('0.3'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 7,
          lowerBound: d('50416.67'),
          upperBound: null,
          rate: d('0.35'),
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created 2026 GRA PAYE tax bands for "${countryCode}" — re-verify against the GRA's gazette annually.`,
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
      `Seed: created SSNIT rates for "${countryCode}" (unchanged for 2026) — re-verify against SSNIT's current published rates before real payroll runs.`,
    );
  }
}

/**
 * Nigeria PAYE tax bands and pension contribution rates, effective
 * 1 January 2026 under the Nigeria Tax Act 2025 (NTA) - a full rewrite of
 * the prior Personal Income Tax Act bands, not an amendment. Real annual
 * bands: 0-800k @0%, 800k-3m @15%, 3m-12m @18%, 12m-25m @21%, 25m-50m @23%,
 * 50m+ @25% - divided by 12 here for the same reason as Ghana's (this
 * engine computes tax per pay run, not annually). Sourced from public
 * NTA-summary alerts (incl. PwC) in July 2026 - confirm against the FIRS's
 * own gazette before relying on these for real payroll.
 *
 * The NTA also repeals the old Consolidated Relief Allowance outright and
 * replaces it with a Rent Relief Allowance (20% of annual rent paid,
 * capped at ₦500k/yr) - see nigeria-rent-relief.ts in payroll-domain and
 * Employee.annualRentPaid, not statutory reference data, since relief
 * eligibility is per-employee, not a published rate.
 *
 * One known gap, not fixed here:
 * 1. StatutoryRateCode's SSNIT_EMPLOYEE/SSNIT_EMPLOYER codes are Ghana's
 *    scheme name (Social Security and National Insurance Trust) reused
 *    here for Nigeria's Pension Reform Act 2014 minimum contribution
 *    (8% employee / 10% employer of basic salary, unchanged by the NTA and
 *    still the current law as of July 2026, though a PenCom-proposed
 *    increase to the employer share was under consultation at time of
 *    writing - re-verify if that review concludes) rather than adding a
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
    await prisma.statutoryTaxBand.createMany({
      data: [
        {
          countryCode,
          order: 1,
          lowerBound: d('0'),
          upperBound: d('66666.67'),
          rate: d('0'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 2,
          lowerBound: d('66666.67'),
          upperBound: d('250000'),
          rate: d('0.15'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 3,
          lowerBound: d('250000'),
          upperBound: d('1000000'),
          rate: d('0.18'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 4,
          lowerBound: d('1000000'),
          upperBound: d('2083333.33'),
          rate: d('0.21'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 5,
          lowerBound: d('2083333.33'),
          upperBound: d('4166666.67'),
          rate: d('0.23'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 6,
          lowerBound: d('4166666.67'),
          upperBound: null,
          rate: d('0.25'),
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created 2026 Nigeria Tax Act PAYE bands for "${countryCode}" — re-verify against the FIRS's gazette annually.`,
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
