-- Data fix, not a real rate change: Ghana's SSNIT_EMPLOYER row was seeded
-- at 13% (the commonly-quoted TOTAL employer pension figure, which is
-- actually Tier 1's 8% + Tier 2's 5% combined), then GHANA_TIER2_PENSION_
-- EMPLOYER's 5% was added on top of that as a separate contribution -
-- double-counting Tier 2 and overstating employer pension cost as 18%
-- instead of the correct 13% (5.5% employee + 13% employer = the correct
-- 18.5% total, not 23.5%). Corrects it to 8%, Tier 1's employer share
-- alone - the portion actually remitted to SSNIT itself - so it sums
-- correctly with Tier 2's already-separate 5% row.
--
-- Updated in place (not versioned as a new effective-dated row) because
-- this corrects a data-entry mistake, not a genuine rate change over time:
-- the true Tier 1 employer rate has been 8% since this row's original
-- effectiveFrom, so nothing should read the wrong 13% for any historical
-- date either. Safe to do because ssnitEmployer never touches employee
-- net pay/PAYE (see payslip-calculator.ts) - only employer-cost reporting
-- - so there is no employee-facing payslip amount this could retroactively
-- corrupt.
UPDATE "statutory_rates"
SET "rate" = 0.08
WHERE "country_code" = 'GH' AND "code" = 'SSNIT_EMPLOYER';
