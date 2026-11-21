-- Raise the baseline payroll disbursement margin from 0 to 1 (this
-- subscription's own currency, GHS for every tenant today): every
-- transaction should carry at least a small ParotHR margin, not just
-- Paystack's pass-through cost.
ALTER TABLE "subscriptions" ALTER COLUMN "disbursement_fee_amount" SET DEFAULT 1;

-- Backfill every subscription still at the old default (never explicitly
-- set by a platform admin via SetDisbursementFeeDto) up to the new floor.
UPDATE "subscriptions" SET "disbursement_fee_amount" = 1 WHERE "disbursement_fee_amount" = 0;
