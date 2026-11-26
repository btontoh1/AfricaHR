import { isInAudience, validateAudience } from './audience-scope';

describe('isInAudience', () => {
  it('TENANT scope includes every employee', () => {
    expect(
      isInAudience(
        { audienceScope: 'TENANT', organizationId: null, organizationUnitId: null },
        { organizationId: 'org-1', organizationUnitId: 'unit-1' },
      ),
    ).toBe(true);
  });

  it('ORGANIZATION scope includes only employees in that organization', () => {
    const audience = { audienceScope: 'ORGANIZATION' as const, organizationId: 'org-1', organizationUnitId: null };
    expect(isInAudience(audience, { organizationId: 'org-1', organizationUnitId: null })).toBe(true);
    expect(isInAudience(audience, { organizationId: 'org-2', organizationUnitId: null })).toBe(false);
  });

  it('ORGANIZATION_UNIT scope includes only employees in that unit', () => {
    const audience = {
      audienceScope: 'ORGANIZATION_UNIT' as const,
      organizationId: null,
      organizationUnitId: 'unit-1',
    };
    expect(isInAudience(audience, { organizationId: 'org-1', organizationUnitId: 'unit-1' })).toBe(true);
    expect(isInAudience(audience, { organizationId: 'org-1', organizationUnitId: 'unit-2' })).toBe(false);
    expect(isInAudience(audience, { organizationId: 'org-1', organizationUnitId: null })).toBe(false);
  });
});

describe('validateAudience', () => {
  it('rejects TENANT scope carrying an organizationId', () => {
    expect(validateAudience({ audienceScope: 'TENANT', organizationId: 'org-1', organizationUnitId: null })).not.toBeNull();
  });

  it('accepts a clean TENANT audience', () => {
    expect(validateAudience({ audienceScope: 'TENANT', organizationId: null, organizationUnitId: null })).toBeNull();
  });

  it('rejects ORGANIZATION scope with no organizationId', () => {
    expect(validateAudience({ audienceScope: 'ORGANIZATION', organizationId: null, organizationUnitId: null })).not.toBeNull();
  });

  it('rejects ORGANIZATION scope carrying an organizationUnitId too', () => {
    expect(
      validateAudience({ audienceScope: 'ORGANIZATION', organizationId: 'org-1', organizationUnitId: 'unit-1' }),
    ).not.toBeNull();
  });

  it('accepts a clean ORGANIZATION audience', () => {
    expect(validateAudience({ audienceScope: 'ORGANIZATION', organizationId: 'org-1', organizationUnitId: null })).toBeNull();
  });

  it('rejects ORGANIZATION_UNIT scope with no organizationUnitId', () => {
    expect(
      validateAudience({ audienceScope: 'ORGANIZATION_UNIT', organizationId: null, organizationUnitId: null }),
    ).not.toBeNull();
  });

  it('accepts a clean ORGANIZATION_UNIT audience', () => {
    expect(
      validateAudience({ audienceScope: 'ORGANIZATION_UNIT', organizationId: null, organizationUnitId: 'unit-1' }),
    ).toBeNull();
  });
});
