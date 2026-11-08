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
 *
 * SSNIT_EMPLOYER here is Tier 1's employer share ALONE (8%, the portion
 * actually remitted to SSNIT itself), not the commonly-quoted "13%
 * employer contribution" headline figure - that 13% is total employer
 * pension cost across BOTH tiers (Tier 1's 8% + Tier 2's 5%), and storing
 * the full 13% under SSNIT_EMPLOYER while also adding Tier 2's 5% as a
 * separate contribution would double-count Tier 2, overstating employer
 * pension cost as 18% instead of the correct 13% (5.5% employee + 13%
 * employer = the correct 18.5% total, not 23.5%). Fixed 2026-09-03 after
 * cross-checking against independent research - see the paired data
 * migration that corrects any already-seeded 13% row.
 *
 * Also seeds Tier 2's mandatory occupational pension rate (5% of basic
 * salary, employer-only, paid to a licensed private trustee rather than
 * SSNIT itself) under GHANA_TIER2_PENSION_EMPLOYER - a genuinely separate
 * contribution from Tier 1 above, not an alternate name for it, so it
 * can't reuse SSNIT_EMPLOYER (see the StatutoryRateCode enum's doc
 * comments). Sourced from public NPRA-summary alerts in August 2026,
 * same confirm-before-real-payroll caveat as the PAYE bands.
 *
 * Also seeds a 1.5x (time-and-a-half) OVERTIME_MULTIPLIER, the commonly
 * cited overtime premium under Ghana's Labour Act 2003 (Act 651) per public
 * payroll-compliance summaries - not otherwise confirmed against a
 * government gazette (blocked by this environment's egress policy, same
 * caveat as NIGERIA_EMPLOYER_LEVY_THRESHOLD in payroll-domain); actual
 * overtime premiums are often set by sector or collective agreement, so
 * confirm the applicable rate before relying on this for real payroll.
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
          rate: 0.08,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.GHANA_TIER2_PENSION_EMPLOYER,
          rate: 0.05,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.OVERTIME_MULTIPLIER,
          rate: 1.5,
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created SSNIT Tier 1 + Tier 2 + overtime multiplier rates for "${countryCode}" (unchanged for 2026) — re-verify against SSNIT's/NPRA's current published rates before real payroll runs.`,
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
 *
 * Also seeds NSITF (NIGERIA_NSITF_EMPLOYER, 1% of basic salary,
 * employer-only) and NHIS (NIGERIA_NHIS_EMPLOYEE/EMPLOYER, 5%/10% of
 * basic salary, per the NHIA Act 2022's OPSSHIP scheme) - unlike every
 * other statutory rate here, whether these actually apply to a given
 * payslip additionally depends on the employing organization having 5+
 * active employees (and for NHIS, the employee's own basic salary
 * clearing NHIS's NGN 30,000 eligibility floor) - both gated in code,
 * not here as data, see payslip-calculator.ts's
 * NIGERIA_EMPLOYER_LEVY_THRESHOLD and nigeria-nhis-eligibility.ts.
 * Whether NHIS's employee share is tax-deductible under the NTA 2025 is
 * directly disputed across secondary sources; this platform treats it as
 * NOT reducing taxable income (the safer default - see
 * payslip-calculator.ts's doc comment for the reasoning). Sourced from
 * public payroll-compliance summaries, cross-referenced across multiple
 * sources but NOT confirmed against nsitf.gov.ng/nhia.gov.ng directly
 * (blocked by this environment's egress policy) - confirm before relying
 * on these for real payroll, same caveat as everything else here.
 * ITF (Industrial Training Fund) is deliberately NOT seeded - it's an
 * annual levy on total organization payroll, filed once a year, not a
 * per-pay-run per-employee deduction, so it doesn't fit this engine's
 * model at all; would need a separate annual-filing feature.
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
        {
          countryCode,
          code: StatutoryRateCode.NIGERIA_NSITF_EMPLOYER,
          rate: 0.01,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.NIGERIA_NHIS_EMPLOYEE,
          rate: 0.05,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.NIGERIA_NHIS_EMPLOYER,
          rate: 0.1,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.OVERTIME_MULTIPLIER,
          rate: 1.5,
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created PLACEHOLDER Pension Reform Act/NSITF/NHIS/overtime multiplier rates for "${countryCode}" (pension stored under the SSNIT_EMPLOYEE/SSNIT_EMPLOYER codes - see this function's doc comment) — confirm against PenCom's/NSITF's/NHIA's current published rates before real payroll runs.`,
    );
  }
}

/**
 * Kenya PAYE tax bands and NSSF contribution rates, in force since
 * 1 July 2023 under the Finance Act 2023 (bands unchanged as of July
 * 2026): 0-24,000 @10%, 24,000-32,333 @25%, 32,333-500,000 @30%,
 * 500,000-800,000 @32.5%, 800,000+ @35% (monthly KES, already the KRA's
 * published monthly figures - no annual/12 conversion needed, unlike
 * Ghana/Nigeria above). Sourced from KRA's own public notice and
 * cross-referenced against independent payroll-calculator summaries in
 * August 2026, but NOT confirmed against KRA's PAYE guide PDF directly
 * (blocked by this environment's egress policy at the time of writing) -
 * confirm against KRA's gazette before relying on these for real payroll.
 *
 * Kenya's resident personal relief (KES 2,400/month, subtracted from the
 * PAYE bands' output rather than from taxable income) is enforced in
 * code, not seeded here - see applyKenyaPersonalRelief in payroll-domain,
 * same reasoning as Ghana's SSNIT cap: it's a step in the calculation,
 * not a rate to store as data.
 *
 * NSSF's Tier I (6% up to the KES 9,000 Lower Earnings Limit) and Tier II
 * (6% between the LEL and the KES 108,000 Upper Earnings Limit, Year 4
 * rates effective 1 February 2026) combine to a flat 6% on pensionable
 * pay capped at the UEL - also enforced in code via
 * applyKenyaPensionableEarningsCap, same shape as Ghana's insurable
 * earnings cap, rather than modeled as two separate StatutoryRate rows.
 *
 * Also seeds SHIF (KENYA_SHIF_EMPLOYEE, 2.75% of gross, subject to a
 * KES 300 floor enforced in code - see kenya-shif.ts) and the Affordable
 * Housing Levy (KENYA_HOUSING_LEVY_EMPLOYEE/EMPLOYER, 1.5% each side) -
 * a prior version of this comment noted these were deliberately
 * unmodeled to avoid getting ahead of Ghana/Nigeria's own statutory
 * coverage; both are now modeled here, in the same pass that added
 * Ghana's Tier 2 pension.
 *
 * Also seeds a flat 1.5x OVERTIME_MULTIPLIER - the Employment Act 2007
 * s.28 actually mandates 1.5x for weekday overtime but 2x for rest-day/
 * public-holiday work, a distinction this engine's per-pay-period
 * (not per-shift) overtime model doesn't capture; same country-wide
 * flat-rate simplification as Ghana/Nigeria's OVERTIME_MULTIPLIER, and
 * same confirm-before-real-payroll caveat.
 */
async function seedKenyaStatutoryData(prisma: PrismaClient): Promise<void> {
  const countryCode = 'KE';
  const effectiveFrom = new Date('2023-07-01');

  const existingBands = await prisma.statutoryTaxBand.findFirst({ where: { countryCode } });
  if (existingBands) {
    console.log(`Seed: statutory tax bands for "${countryCode}" already exist, skipping.`);
  } else {
    await prisma.statutoryTaxBand.createMany({
      data: [
        { countryCode, order: 1, lowerBound: d('0'), upperBound: d('24000'), rate: d('0.1'), effectiveFrom },
        {
          countryCode,
          order: 2,
          lowerBound: d('24000'),
          upperBound: d('32333'),
          rate: d('0.25'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 3,
          lowerBound: d('32333'),
          upperBound: d('500000'),
          rate: d('0.3'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 4,
          lowerBound: d('500000'),
          upperBound: d('800000'),
          rate: d('0.325'),
          effectiveFrom,
        },
        {
          countryCode,
          order: 5,
          lowerBound: d('800000'),
          upperBound: null,
          rate: d('0.35'),
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created Finance Act 2023 KRA PAYE tax bands for "${countryCode}" — re-verify against the KRA's gazette before real payroll runs.`,
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
          rate: 0.06,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.SSNIT_EMPLOYER,
          rate: 0.06,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.KENYA_SHIF_EMPLOYEE,
          rate: 0.0275,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.KENYA_HOUSING_LEVY_EMPLOYEE,
          rate: 0.015,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.KENYA_HOUSING_LEVY_EMPLOYER,
          rate: 0.015,
          effectiveFrom,
        },
        {
          countryCode,
          code: StatutoryRateCode.OVERTIME_MULTIPLIER,
          rate: 1.5,
          effectiveFrom,
        },
      ],
    });
    console.log(
      `Seed: created NSSF/SHIF/Housing Levy/overtime multiplier rates for "${countryCode}" (NSSF stored under the SSNIT_EMPLOYEE/SSNIT_EMPLOYER codes - see this function's doc comment) — confirm against NSSF's/SHA's/KRA's current published rates before real payroll runs.`,
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
    await seedKenyaStatutoryData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
