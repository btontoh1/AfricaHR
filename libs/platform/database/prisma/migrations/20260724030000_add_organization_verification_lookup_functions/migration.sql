-- The platform-admin verification queue is a genuinely cross-tenant read:
-- a PLATFORM_ADMIN reviews organizations across every tenant, not just one.
-- "organizations" and "organization_verification_documents" both have
-- non-nullable tenant_id, so they use the plain tenant_isolation policy
-- (RLS_CONVENTION.md §2) - unlike the nullable-tenant §4 case (users,
-- refresh_tokens), that plain policy has no platform-sentinel branch, so
-- withPlatformScope's '__platform__' GUC value can never equal a real
-- tenant_id and every query returns zero rows (verified directly: set the
-- sentinel and SELECT count(*) FROM organizations as africahr_app -> 0,
-- even though rows plainly exist). This needs the §5 SECURITY DEFINER
-- pattern instead, same as find_user_for_login /
-- find_refresh_token_by_hash - a narrow, auditable exception scoped to
-- exactly this read, not a general RLS bypass.
CREATE FUNCTION find_organizations_pending_review()
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "legalName" TEXT,
  "tradingName" TEXT,
  "countryCode" TEXT,
  "registrationNumber" TEXT,
  "taxIdentificationNumber" TEXT,
  metadata JSONB,
  "verificationStatus" "OrganizationVerificationStatus",
  "verificationNote" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
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
  SELECT id, tenant_id, legal_name, trading_name, country_code, registration_number,
         tax_identification_number, metadata, verification_status, verification_note,
         verified_at, verified_by, created_at, updated_at, deleted_at, created_by, updated_by
  FROM organizations
  WHERE verification_status = 'PENDING_REVIEW' AND deleted_at IS NULL
  ORDER BY created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION find_organizations_pending_review() TO africahr_app;

-- Same reasoning, for resolving a single org (and its owning tenant_id) by
-- id alone once a platform admin has picked one from the queue above.
CREATE FUNCTION find_organization_by_id_across_tenants(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "legalName" TEXT,
  "tradingName" TEXT,
  "countryCode" TEXT,
  "registrationNumber" TEXT,
  "taxIdentificationNumber" TEXT,
  metadata JSONB,
  "verificationStatus" "OrganizationVerificationStatus",
  "verificationNote" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
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
  SELECT id, tenant_id, legal_name, trading_name, country_code, registration_number,
         tax_identification_number, metadata, verification_status, verification_note,
         verified_at, verified_by, created_at, updated_at, deleted_at, created_by, updated_by
  FROM organizations
  WHERE id = p_id AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_organization_by_id_across_tenants(TEXT) TO africahr_app;

-- Same reasoning again, for a platform admin viewing a verification
-- document from the queue without knowing its tenant up front.
CREATE FUNCTION find_verification_document_by_id_across_tenants(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "organizationId" TEXT,
  "documentType" "VerificationDocumentType",
  "storageKey" TEXT,
  "fileName" TEXT,
  "contentType" TEXT,
  "createdAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, organization_id, document_type, storage_key, file_name,
         content_type, created_at, deleted_at, created_by
  FROM organization_verification_documents
  WHERE id = p_id AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_verification_document_by_id_across_tenants(TEXT) TO africahr_app;
