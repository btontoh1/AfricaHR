-- The platform-admin audit log viewer needs to read audit_logs across every
-- tenant at once, which a platform-admin request has no single tenant
-- context for. "audit_logs" has a *nullable* tenant_id (RLS_CONVENTION.md
-- §4: NULL identifies platform-admin-owned rows), but that policy only
-- exempts platform-admin rows from RLS - it does not make tenant-scoped
-- rows visible to a platform-scoped query (see the §4 note and
-- PlatformBillingRepository's own comment for the same reasoning applied
-- to non-nullable-tenant tables). So this is the §5 SECURITY DEFINER
-- exception, same pattern as platform_list_subscriptions().
--
-- Joins in tenants.name and the actor's user fields so the viewer doesn't
-- need N+1 follow-up lookups; both joins are LEFT JOINs since tenantId and
-- actorUserId are independently nullable (system-initiated actions have no
-- actor; platform-admin-initiated actions have no tenant).
--
-- Every filter parameter is optional (NULL = "don't filter on this") so a
-- single function serves both the unfiltered and filtered list views.
-- action/resource_type use ILIKE for partial matching since there is no
-- fixed enum of action strings (see the scattered 'domain.entity.verb'
-- literals throughout every *.service.ts's AuditService.record() calls).
--
-- totalCount is a COUNT(*) OVER() window column rather than a second
-- query, so the repository gets the filtered total and the current page
-- in one round trip - cast to TEXT rather than returned as BIGINT for the
-- same reason PlatformBillingRepository's functions cast NUMERIC to TEXT:
-- no existing $queryRaw+bigint precedent in this repo to confirm which
-- representation the driver adapter would produce over the wire.
CREATE FUNCTION platform_list_audit_logs(
  p_tenant_id TEXT,
  p_actor_user_id TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_from TIMESTAMP(3),
  p_to TIMESTAMP(3),
  p_limit INTEGER,
  p_offset INTEGER
)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "tenantName" TEXT,
  "actorUserId" TEXT,
  "actorEmail" TEXT,
  "actorFirstName" TEXT,
  "actorLastName" TEXT,
  action TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP(3),
  "totalCount" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.tenant_id,
    t.name,
    a.actor_user_id,
    u.email,
    u.first_name,
    u.last_name,
    a.action,
    a.resource_type,
    a.resource_id,
    a.metadata,
    a.created_at,
    (COUNT(*) OVER())::TEXT AS "totalCount"
  FROM audit_logs a
  LEFT JOIN tenants t ON t.id = a.tenant_id
  LEFT JOIN users u ON u.id = a.actor_user_id
  WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
    AND (p_actor_user_id IS NULL OR a.actor_user_id = p_actor_user_id)
    AND (p_action IS NULL OR a.action ILIKE '%' || p_action || '%')
    AND (p_resource_type IS NULL OR a.resource_type ILIKE '%' || p_resource_type || '%')
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION platform_list_audit_logs(TEXT, TEXT, TEXT, TEXT, TIMESTAMP(3), TIMESTAMP(3), INTEGER, INTEGER) TO africahr_app;
