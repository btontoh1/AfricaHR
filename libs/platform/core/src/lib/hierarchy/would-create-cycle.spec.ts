import { HierarchyNode, wouldCreateCycle } from './would-create-cycle';

describe('wouldCreateCycle', () => {
  const nodes: HierarchyNode[] = [
    { id: 'root', parentId: null },
    { id: 'hr', parentId: 'root' },
    { id: 'payroll', parentId: 'hr' },
    { id: 'benefits', parentId: 'hr' },
  ];

  it('allows setting a valid new parent', () => {
    expect(wouldCreateCycle(nodes, 'benefits', 'root')).toBe(false);
  });

  it('allows clearing the parent (making it a root node)', () => {
    expect(wouldCreateCycle(nodes, 'hr', null)).toBe(false);
  });

  it('rejects a node becoming its own parent', () => {
    expect(wouldCreateCycle(nodes, 'hr', 'hr')).toBe(true);
  });

  it('rejects setting a descendant as the parent (direct cycle)', () => {
    expect(wouldCreateCycle(nodes, 'hr', 'payroll')).toBe(true);
  });

  it('rejects setting a deeper descendant as the parent', () => {
    const deep: HierarchyNode[] = [...nodes, { id: 'payroll-ops', parentId: 'payroll' }];
    expect(wouldCreateCycle(deep, 'hr', 'payroll-ops')).toBe(true);
  });

  it('allows moving a node under an unrelated branch', () => {
    expect(wouldCreateCycle(nodes, 'payroll', 'benefits')).toBe(false);
  });
});
