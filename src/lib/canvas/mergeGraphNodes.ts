import type { Node } from "@xyflow/react";

/**
 * Merges an incoming (fresh from API) node array into the current canvas state.
 * Preserves user-dragged positions, hidden flags, and ephemeral expand state.
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

    const apiPos = nextNode.position;
    const userDragged =
      Math.abs(prevNode.position.x - apiPos.x) > 1 ||
      Math.abs(prevNode.position.y - apiPos.y) > 1;

    const prevData = prevNode.data as Record<string, unknown>;
    const nextData = nextNode.data as Record<string, unknown>;

    merged.push({
      ...nextNode,
      position: userDragged ? prevNode.position : nextNode.position,
      hidden: prevNode.hidden ?? nextNode.hidden,
      data: {
        ...nextData,
        isExpanded: prevData.isExpanded ?? nextData.isExpanded,
        onToggleExpand:
          prevData.onToggleExpand ?? nextData.onToggleExpand,
      },
    });
  }

  return merged;
}
