"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "./client";
import type { OrgGraphResponse } from "./types";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { buildGraphFromApi } from "@/lib/canvas/buildGraphFromApi";
import { mergeGraphNodes } from "@/lib/canvas/mergeGraphNodes";
import { logOnce, logDevOnce } from "@/lib/diagnostics";
import { applyStoredNodePositions } from "@/lib/canvas/persistence";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

/** Stable hash of graph content that affects canvas layout */
function graphContentHash(data: OrgGraphResponse): string {
  return JSON.stringify({
    taskIds: data.tasks.map((t) => t.id).sort(),
    deps: data.tasks
      .flatMap((t) => t.dependencies.map((d) => `${d}→${t.id}`))
      .sort(),
    statuses: data.tasks.map((t) => `${t.id}:${t.status}`).sort(),
    positions: data.tasks
      .map((t) => `${t.id}:${Math.round(t.canvasX)}:${Math.round(t.canvasY)}`)
      .sort(),
    projectPositions: data.projects
      .map(
        (p) =>
          `${p.id}:${Math.round(p.canvasX ?? 0)}:${Math.round(p.canvasY ?? 0)}`,
      )
      .sort(),
    milestonePositions: (data.milestones ?? [])
      .map(
        (m) =>
          `${m.id}:${Math.round(m.canvasX ?? 0)}:${Math.round(m.canvasY ?? 0)}`,
      )
      .sort(),
  });
}

export function useOrgGraph() {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setCanvasLoading = useUIStore((s) => s.setCanvasLoading);
  const setCanvasError = useUIStore((s) => s.setCanvasError);
  const graphHashRef = useRef("");

  const query = useQuery({
    queryKey: ["org-graph", ORG_ID],
    queryFn: () => apiClient.getOrgGraph(ORG_ID),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: ORG_ID.length > 0,
    retry: 1,
  });

  useEffect(() => {
    setCanvasLoading(query.isLoading);
  }, [query.isLoading, setCanvasLoading]);

  useEffect(() => {
    if (query.error) {
      const isAuthError =
        query.error instanceof Error &&
        query.error.message === "UNAUTHORIZED";
      if (isAuthError) {
        logOnce(
          "org-graph-401",
          "[OrgGraph] 401 UNAUTHORIZED — session invalid; sign in again (no hard reload)",
        );
        setCanvasError("Session expired. Please refresh the page.");
        return;
      }
      const message =
        query.error instanceof Error
          ? query.error.message
          : "Failed to load graph";
      logOnce(
        "org-graph-query-failed",
        `[OrgGraph] graph query failed: ${message} (check API URL, CORS, or network)`,
      );
      setCanvasError(message);
    } else {
      setCanvasError(null);
    }
  }, [query.error, setCanvasError]);

  useEffect(() => {
    if (!query.data || !query.isSuccess) return;

    logOnce(
      "org-graph-loaded",
      `[Audit] Org graph loaded (${query.data.tasks.length} tasks, ${query.data.projects.length} projects)`,
    );

    const hash = graphContentHash(query.data);
    if (hash === graphHashRef.current) {
      logDevOnce(
        "org-graph-unchanged",
        "[OrgGraph] graph content unchanged, skipping rebuild",
      );
      return;
    }
    graphHashRef.current = hash;
    logDevOnce("org-graph-rebuild", "[OrgGraph] graph content changed, rebuilding canvas");

    const { nodes, edges } = buildGraphFromApi(query.data);
    const restoredNodes = applyStoredNodePositions(ORG_ID || "default", nodes);
    setNodes((prev) => mergeGraphNodes(prev, restoredNodes));
    setEdges(edges);
  }, [query.data, setNodes, setEdges]);

  return query;
}
