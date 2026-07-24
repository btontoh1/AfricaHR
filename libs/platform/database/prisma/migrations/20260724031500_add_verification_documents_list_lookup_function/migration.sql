-- A platform-admin reviewer needs to see every document uploaded for an
-- organization before deciding, not just fetch one by id (which requires
-- already knowing the id) - same cross-tenant reasoning and SECURITY
-- DEFINER pattern as find_organizations_pending_review /
-- find_verification_document_by_id_across_tenants.
CREATE FUNCTION find_verification_documents_by_organization_across_tenants(p_organization_id TEXT)
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
  WHERE organization_id = p_organization_id AND deleted_at IS NULL
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION find_verification_documents_by_organization_across_tenants(TEXT) TO africahr_app;
