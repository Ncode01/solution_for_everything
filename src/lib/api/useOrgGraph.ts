"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { buildGraphFromApi } from "@/lib/canvas/buildGraphFromApi";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useOrgGraph() {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setCanvasLoading = useUIStore((s) => s.setCanvasLoading);
  const setCanvasError = useUIStore((s) => s.setCanvasError);

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
        query.error instanceof Error ? query.error.message : "Failed to load graph",
      );
    } else {
      setCanvasError(null);
    }
  }, [query.error, setCanvasError]);

  useEffect(() => {
    if (!query.data) return;
    const { nodes, edges } = buildGraphFromApi(query.data);
    setNodes(nodes);
    setEdges(edges);
  }, [query.data, setNodes, setEdges]);

  return query;
}
