export interface UnitConversionEdge {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
}

/**
 * True if adding a fromUnitId -> toUnitId edge to the existing conversion
 * graph would create a cycle (e.g. box->carton already exists, so
 * carton->box would close a loop) - InventoryUnitConversionService rejects
 * any edge this returns true for, since a cyclic conversion graph has no
 * single well-defined factor between the units it touches.
 */
export function wouldCreateCycle(
  existing: readonly UnitConversionEdge[],
  candidate: Pick<UnitConversionEdge, 'fromUnitId' | 'toUnitId'>,
): boolean {
  if (candidate.fromUnitId === candidate.toUnitId) {
    return true;
  }

  const adjacency = new Map<string, string[]>();
  for (const edge of existing) {
    const list = adjacency.get(edge.fromUnitId) ?? [];
    list.push(edge.toUnitId);
    adjacency.set(edge.fromUnitId, list);
  }

  // DFS from the candidate's toUnitId - reaching fromUnitId means the new
  // edge would close a loop back to where it started.
  const visited = new Set<string>();
  const stack = [candidate.toUnitId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === candidate.fromUnitId) {
      return true;
    }
    if (current === undefined || visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

/**
 * Converts a quantity from fromUnitId into toUnitId by walking the
 * conversion graph (e.g. carton -> box -> strip -> tablet). Returns null if
 * no path connects the two units - callers must treat that as "can't
 * convert", never as a zero quantity.
 *
 * Each stored edge is usable in both directions (1 carton = 20 box also
 * means 1 box = 1/20 carton), so the graph only needs one row per pair, not
 * two. Because wouldCreateCycle rejects any edge that would close a loop,
 * the graph is always a forest - there is at most one path between any two
 * connected units, so which traversal order finds it doesn't matter.
 */
export function convertQuantity(
  edges: readonly UnitConversionEdge[],
  fromUnitId: string,
  toUnitId: string,
  quantity: number,
): number | null {
  if (fromUnitId === toUnitId) {
    return quantity;
  }

  const adjacency = new Map<string, { toUnitId: string; factor: number }[]>();
  const addEdge = (from: string, to: string, factor: number) => {
    const list = adjacency.get(from) ?? [];
    list.push({ toUnitId: to, factor });
    adjacency.set(from, list);
  };
  for (const edge of edges) {
    addEdge(edge.fromUnitId, edge.toUnitId, edge.factor);
    addEdge(edge.toUnitId, edge.fromUnitId, 1 / edge.factor);
  }

  const visited = new Set<string>([fromUnitId]);
  let frontier: { unitId: string; factor: number }[] = [{ unitId: fromUnitId, factor: 1 }];
  while (frontier.length > 0) {
    const next: { unitId: string; factor: number }[] = [];
    for (const { unitId, factor } of frontier) {
      if (unitId === toUnitId) {
        return quantity * factor;
      }
      for (const edge of adjacency.get(unitId) ?? []) {
        if (!visited.has(edge.toUnitId)) {
          visited.add(edge.toUnitId);
          next.push({ unitId: edge.toUnitId, factor: factor * edge.factor });
        }
      }
    }
    frontier = next;
  }
  return null;
}
