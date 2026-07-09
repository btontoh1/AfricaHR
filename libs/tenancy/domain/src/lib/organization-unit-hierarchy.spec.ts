import { wouldCreateCycle, OrganizationUnitNode } from './organization-unit-hierarchy';

describe('wouldCreateCycle', () => {
  const units: OrganizationUnitNode[] = [
    { id: 'root', parentId: null },
    { id: 'hr', parentId: 'root' },
    { id: 'payroll', parentId: 'hr' },
    { id: 'benefits', parentId: 'hr' },
  ];

  it('allows setting a valid new parent', () => {
    expect(wouldCreateCycle(units, 'benefits', 'root')).toBe(false);
  });

  it('allows clearing the parent (making it a root unit)', () => {
    expect(wouldCreateCycle(units, 'hr', null)).toBe(false);
  });

  it('rejects a unit becoming its own parent', () => {
    expect(wouldCreateCycle(units, 'hr', 'hr')).toBe(true);
  });

  it('rejects setting a descendant as the parent (direct cycle)', () => {
    expect(wouldCreateCycle(units, 'hr', 'payroll')).toBe(true);
  });

  it('rejects setting a deeper descendant as the parent', () => {
    const deep: OrganizationUnitNode[] = [
      ...units,
      { id: 'payroll-ops', parentId: 'payroll' },
    ];
    expect(wouldCreateCycle(deep, 'hr', 'payroll-ops')).toBe(true);
  });

  it('allows moving a unit under an unrelated branch', () => {
    expect(wouldCreateCycle(units, 'payroll', 'benefits')).toBe(false);
  });
});
