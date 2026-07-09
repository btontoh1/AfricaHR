export interface OrganizationUnitNode {
  id: string;
  parentId: string | null;
}

/**
 * Returns true if setting `candidateParentId` as the parent of `unitId` would
 * create a cycle (i.e. candidateParentId is unitId itself, or a descendant of
 * unitId within the given unit graph).
 */
export function wouldCreateCycle(
  units: OrganizationUnitNode[],
  unitId: string,
  candidateParentId: string | null,
): boolean {
  if (candidateParentId === null) {
    return false;
  }
  if (candidateParentId === unitId) {
    return true;
  }

  const byId = new Map(units.map((unit) => [unit.id, unit]));
  let current = byId.get(candidateParentId) ?? null;
  const visited = new Set<string>();

  while (current) {
    if (current.id === unitId) {
      return true;
    }
    if (visited.has(current.id)) {
      // Existing corrupt data already has a cycle unrelated to this change.
      return false;
    }
    visited.add(current.id);
    current = current.parentId ? byId.get(current.parentId) ?? null : null;
  }

  return false;
}
