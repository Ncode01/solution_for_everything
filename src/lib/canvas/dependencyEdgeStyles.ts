import { MarkerType, type Edge } from "@xyflow/react";
import type { OrgGraphResponse } from "@/lib/api/types";
import { buildGraphFromApi } from "@/lib/canvas/buildGraphFromApi";

const DEFAULT_DEP_STYLE = {
  stroke: "rgba(137, 146, 148, 0.35)",
  strokeWidth: 1.5,
  opacity: 1,
} as const;

const DEFAULT_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: "rgba(137, 146, 148, 0.35)",
} as const;

/** Reset dependency edges after workload/cascade overlays (uses API graph when available). */
export function restoreDependencyEdgeStyles(
  edges: Edge[],
  graph?: OrgGraphResponse | null,
): Edge[] {
  if (graph) {
    const { edges: fresh } = buildGraphFromApi(graph);
    const defaults = new Map(
      fresh.filter((e) => e.id.startsWith("dep-")).map((e) => [e.id, e]),
    );
    return edges.map((edge) => {
      if (!edge.id.startsWith("dep-")) return edge;
      const def = defaults.get(edge.id);
      if (!def) return applyDefaultDepStyle(edge);
      return {
        ...edge,
        style: def.style,
        markerEnd: def.markerEnd,
        animated: def.animated,
      };
    });
  }

  return edges.map((edge) =>
    edge.id.startsWith("dep-") ? applyDefaultDepStyle(edge) : edge,
  );
}

function applyDefaultDepStyle(edge: Edge): Edge {
  return {
    ...edge,
    style: { ...DEFAULT_DEP_STYLE },
    markerEnd: { ...DEFAULT_MARKER },
    animated: false,
  };
}
