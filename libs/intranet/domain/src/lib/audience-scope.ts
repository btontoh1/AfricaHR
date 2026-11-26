export type AudienceScopeValue = 'TENANT' | 'ORGANIZATION' | 'ORGANIZATION_UNIT';

export interface Audience {
  audienceScope: AudienceScopeValue;
  organizationId: string | null;
  organizationUnitId: string | null;
}

export interface EmployeeOrgContext {
  organizationId: string;
  organizationUnitId: string | null;
}

/**
 * Whether an employee falls inside a piece of content's audience - the
 * same targeting rule for policies, announcements and anything else
 * scoped to the whole tenant ("group"), one Organization ("company") or
 * one OrganizationUnit ("department"). Pure so it can be unit-tested
 * without a database, and reused by every repository that needs to filter
 * "what can this employee see".
 */
export function isInAudience(audience: Audience, employee: EmployeeOrgContext): boolean {
  switch (audience.audienceScope) {
    case 'TENANT':
      return true;
    case 'ORGANIZATION':
      return employee.organizationId === audience.organizationId;
    case 'ORGANIZATION_UNIT':
      return employee.organizationUnitId === audience.organizationUnitId;
  }
}

/**
 * Validates that an audience's organizationId/organizationUnitId match
 * what its audienceScope requires - TENANT carries neither, ORGANIZATION
 * carries only organizationId, ORGANIZATION_UNIT carries only
 * organizationUnitId. Returns an error message, or null when valid.
 */
export function validateAudience(audience: Audience): string | null {
  switch (audience.audienceScope) {
    case 'TENANT':
      if (audience.organizationId || audience.organizationUnitId) {
        return 'organizationId/organizationUnitId must not be set when audienceScope is TENANT';
      }
      return null;
    case 'ORGANIZATION':
      if (!audience.organizationId) {
        return 'organizationId is required when audienceScope is ORGANIZATION';
      }
      if (audience.organizationUnitId) {
        return 'organizationUnitId must not be set when audienceScope is ORGANIZATION';
      }
      return null;
    case 'ORGANIZATION_UNIT':
      if (!audience.organizationUnitId) {
        return 'organizationUnitId is required when audienceScope is ORGANIZATION_UNIT';
      }
      return null;
  }
}
