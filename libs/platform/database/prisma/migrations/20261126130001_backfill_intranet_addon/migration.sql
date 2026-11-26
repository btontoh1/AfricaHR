-- INTRANET (Policies/Announcements/Weekly Reports) existed as a core
-- feature before add-on gating was introduced for it - every tenant that
-- predates this migration gets it added to enabled_add_ons so no one loses
-- access they already had. A platform admin can still switch it off per
-- tenant afterward.
UPDATE "tenants"
SET "enabled_add_ons" = array_append("enabled_add_ons", 'INTRANET');
