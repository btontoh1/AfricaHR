-- RECRUITMENT and PERFORMANCE existed as core features before add-on
-- gating was introduced (unlike INVOICING, which was opt-in from day
-- one) - every tenant that predates this migration gets both added to
-- enabled_add_ons so no one loses access they already had. A platform
-- admin can still switch either off per tenant afterward.
UPDATE "tenants"
SET "enabled_add_ons" = array_append(array_append("enabled_add_ons", 'RECRUITMENT'), 'PERFORMANCE');
