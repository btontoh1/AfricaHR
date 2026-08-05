-- The platform-admin dashboard needs to answer "is the platform actually
-- delivering email" across every tenant at once - NotificationService
-- already persists per-notification status/failureReason
-- (notification.service.ts's dispatch()), but nothing ever read it back
-- cross-tenant. Every existing notification controller is scoped to
-- tenants/:tenantId/... (NOTIFICATIONS_READ/NOTIFICATIONS_MANAGE), which
-- can't answer a platform-wide question - and it's the platform admin,
-- not any one tenant, who owns the SendGrid integration this data is
-- really about.
--
-- Scoped to channel = 'EMAIL' only: IN_APP notifications short-circuit to
-- SENT unconditionally in NotificationService.dispatch() (an in-process
-- DB write can't fail the way an external email API call can), so
-- including them would only dilute the signal this exists to surface.
--
-- "notifications" has a non-nullable tenant_id, so it uses the plain
-- tenant_isolation RLS policy (RLS_CONVENTION.md §2) - unlike the
-- nullable-tenant §4 case, that policy has no platform-sentinel branch,
-- so withPlatformScope would silently return zero rows here. Same §5
-- SECURITY DEFINER exception as find_stale_pending_payslip_disbursements.
--
-- Counts are cast to TEXT rather than returned as BIGINT for the same
-- reason platform_list_audit_logs's totalCount is - no existing
-- $queryRaw+bigint precedent in this repo to confirm wire representation.
CREATE FUNCTION platform_notification_delivery_counts()
RETURNS TABLE (sent TEXT, failed TEXT, pending TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE status = 'SENT')::TEXT,
    count(*) FILTER (WHERE status = 'FAILED')::TEXT,
    count(*) FILTER (WHERE status = 'PENDING')::TEXT
  FROM notifications
  WHERE channel = 'EMAIL' AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION platform_notification_delivery_counts() TO africahr_app;

-- The individual FAILED rows a platform admin would actually need to
-- investigate, joined with tenant name and the recipient's identity so
-- the dashboard doesn't need N+1 follow-up lookups. Capped by p_limit
-- (caller passes a small constant) rather than a time window, since a
-- handful of the most recent failures is what's actionable - see
-- PlatformNotificationService for how this is presented.
CREATE FUNCTION platform_list_failed_notifications(p_limit INTEGER)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "tenantName" TEXT,
  "userId" TEXT,
  "userEmail" TEXT,
  "userFirstName" TEXT,
  "userLastName" TEXT,
  subject TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.id,
    n.tenant_id,
    t.name,
    n.user_id,
    u.email,
    u.first_name,
    u.last_name,
    n.subject,
    n.failure_reason,
    n.created_at
  FROM notifications n
  JOIN users u ON u.id = n.user_id
  LEFT JOIN tenants t ON t.id = n.tenant_id
  WHERE n.channel = 'EMAIL' AND n.status = 'FAILED' AND n.deleted_at IS NULL
  ORDER BY n.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION platform_list_failed_notifications(INTEGER) TO africahr_app;
