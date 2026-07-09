export interface HierarchyNode {
  id: string;
  parentId: string | null;
}

/**
 * Returns true if setting `candidateParentId` as the parent of `nodeId`
 * would create a cycle (i.e. candidateParentId is nodeId itself, or a
 * descendant of nodeId within the given graph). Generic over any
 * self-referencing tree — used by OrganizationUnit's department hierarchy
 * and Employee's manager reporting line.
 */
export function wouldCreateCycle(
  nodes: HierarchyNode[],
  nodeId: string,
  candidateParentId: string | null,
): boolean {
  if (candidateParentId === null) {
    return false;
  }
  if (candidateParentId === nodeId) {
    return true;
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  let current = byId.get(candidateParentId) ?? null;
  const visited = new Set<string>();

  while (current) {
    if (current.id === nodeId) {
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
