"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "./client";
import type { OrgGraphResponse } from "./types";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { buildGraphFromApi } from "@/lib/canvas/buildGraphFromApi";
import { mergeGraphNodes } from "@/lib/canvas/mergeGraphNodes";

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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: ORG_ID.length > 0,
    retry: 1,
  });

  useEffect(() => {
    setCanvasLoading(query.isLoading);
  }, [query.isLoading, setCanvasLoading]);

  useEffect(() => {
    if (query.error) {
      setCanvasError(
        query.error instanceof Error
          ? query.error.message
          : "Failed to load graph",
      );
    } else {
      setCanvasError(null);
    }
  }, [query.error, setCanvasError]);

  useEffect(() => {
    if (!query.data) return;

    const hash = graphContentHash(query.data);
    if (hash === graphHashRef.current) return;
    graphHashRef.current = hash;

    const { nodes, edges } = buildGraphFromApi(query.data);
    setNodes((prev) => mergeGraphNodes(prev, nodes));
    setEdges(edges);
  }, [query.data, setNodes, setEdges]);

  return query;
}
