-- The plain unique index on users.email let a soft-deleted user
-- permanently block that email from ever being reused, even though
-- find_user_for_login() already treats deleted_at IS NULL as "free."
-- Replace it with a partial unique index that agrees with that rule.
DROP INDEX "users_email_key";

CREATE UNIQUE INDEX "users_email_active_key" ON "users"("email") WHERE "deleted_at" IS NULL;
