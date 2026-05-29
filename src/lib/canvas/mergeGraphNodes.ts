import type { Node } from "@xyflow/react";

/**
 * Merges an incoming (fresh from API) node array into the current canvas state.
 * Preserves DB-saved positions, hidden flags, and ephemeral expand state.
 */
export function mergeGraphNodes(prev: Node[], next: Node[]): Node[] {
  const prevMap = new Map(prev.map((n) => [n.id, n]));
  const merged: Node[] = [];

  for (const nextNode of next) {
    const prevNode = prevMap.get(nextNode.id);
    if (!prevNode) {
      merged.push(nextNode);
      continue;
    }

    const prevData = prevNode.data as Record<string, unknown>;
    const nextData = nextNode.data as Record<string, unknown>;

    const savedToDb = Boolean(nextData._savedToDb);

    const preservePosition =
      savedToDb &&
      (Math.abs(prevNode.position.x - nextNode.position.x) > 1 ||
        Math.abs(prevNode.position.y - nextNode.position.y) > 1);

    // Prefer API/deterministic data; preserve only client-owned ephemeral fields.
    // Do not carry stale callbacks (e.g. onToggleExpand) from prev — wired in FlowCanvas.
    const { onToggleExpand: _omit, ...nextDataWithoutCallbacks } = nextData;
    void _omit;

    merged.push({
      ...nextNode,
      position: preservePosition ? prevNode.position : nextNode.position,
      hidden: prevNode.hidden ?? nextNode.hidden,
      data: {
        ...nextDataWithoutCallbacks,
        isExpanded: prevData.isExpanded ?? nextData.isExpanded,
      },
    });
  }

  return merged;
}
