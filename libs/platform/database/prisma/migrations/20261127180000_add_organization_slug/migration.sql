-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "slug" TEXT;

-- Backfill: derive from trading_name (fallback legal_name), lowercase,
-- collapse non-alphanumeric runs into a single hyphen, trim leading/
-- trailing hyphens - same shape OrganizationService.create's slugify()
-- produces for new rows. A blank result (e.g. a name with no alphanumeric
-- characters) falls back to 'org'. Collisions within the same tenant get a
-- short suffix from the row's own id, keeping the first-created row (by id
-- order) on the clean base slug.
WITH base AS (
  SELECT
    id,
    tenant_id,
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(lower(trim(coalesce(trading_name, legal_name))), '[^a-z0-9]+', '-', 'g'),
          '(^-+)|(-+$)', '', 'g'
        ),
        ''
      ),
      'org'
    ) AS base_slug
  FROM organizations
),
numbered AS (
  SELECT
    id,
    tenant_id,
    base_slug,
    row_number() OVER (PARTITION BY tenant_id, base_slug ORDER BY id) AS rn
  FROM base
)
UPDATE organizations o
SET slug = CASE
  WHEN n.rn = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || substr(o.id, 1, 8)
END
FROM numbered n
WHERE o.id = n.id;

-- AlterColumn
ALTER TABLE "organizations" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tenant_id_slug_key" ON "organizations"("tenant_id", "slug");
