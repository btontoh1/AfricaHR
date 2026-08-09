-- A candidate applying through a company's public careers page opens a job
-- posting by requisition id alone, with no tenant known yet (no session, no
-- JWT) - the same "genuinely cross-tenant lookup" case as
-- find_user_for_login / find_organization_by_id_across_tenants
-- (RLS_CONVENTION.md §5). Scoped to OPEN, non-deleted requisitions only at
-- the SQL level (not just in application code) so a DRAFT/CLOSED/CANCELLED
-- requisition - or someone else's tenant's row - is never visible through
-- this path, even to someone guessing ids.
CREATE FUNCTION find_open_job_requisition_for_public_apply(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "organizationId" TEXT,
  "organizationUnitId" TEXT,
  "hiringManagerId" TEXT,
  title TEXT,
  description TEXT,
  "employmentType" "EmploymentType",
  openings INT,
  status "JobRequisitionStatus",
  "targetHireDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, organization_id, organization_unit_id, hiring_manager_id, title,
         description, employment_type, openings, status, target_hire_date,
         created_at, updated_at, deleted_at, created_by, updated_by
  FROM job_requisitions
  WHERE id = p_id AND status = 'OPEN' AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_open_job_requisition_for_public_apply(TEXT) TO africahr_app;
