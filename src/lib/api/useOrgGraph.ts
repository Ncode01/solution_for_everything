"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "./client";
import type { OrgGraphResponse } from "./types";
import {
  ENV_ORG_ID,
  getEffectiveOrgId,
  setSessionDiscoveredOrgId,
} from "./orgId";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { buildGraphFromApi } from "@/lib/canvas/buildGraphFromApi";
import { mergeGraphNodes } from "@/lib/canvas/mergeGraphNodes";
import { logOnce, logDevOnce } from "@/lib/diagnostics";

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
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setCanvasLoading = useUIStore((s) => s.setCanvasLoading);
  const setCanvasError = useUIStore((s) => s.setCanvasError);
  const graphHashRef = useRef("");
  const [resolvedOrgId, setResolvedOrgId] = useState("");
  const effectiveOrgId = ENV_ORG_ID || resolvedOrgId;

  const query = useQuery({
    queryKey: ["org-graph", effectiveOrgId],
    queryFn: () => apiClient.getOrgGraph(effectiveOrgId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: effectiveOrgId.length > 0,
    retry: 1,
  });

  const fallbackQuery = useQuery({
    queryKey: ["orgs-first"],
    queryFn: () => apiClient.getFirstOrg(),
    enabled:
      !ENV_ORG_ID ||
      (query.isError &&
        query.error instanceof Error &&
        query.error.message === "Org not found"),
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (!fallbackQuery.data) return;
    logOnce(
      "org-id-auto-healed",
      `[Config] Auto-discovered org: ${fallbackQuery.data.name} (${fallbackQuery.data.id})\n` +
        `Add to .env.local: NEXT_PUBLIC_ORG_ID=${fallbackQuery.data.id}`,
    );
    setSessionDiscoveredOrgId(fallbackQuery.data.id);
    setResolvedOrgId(fallbackQuery.data.id);
    void queryClient.invalidateQueries({ queryKey: ["org-graph"] });
  }, [fallbackQuery.data, queryClient]);

  useEffect(() => {
    setCanvasLoading(query.isLoading || fallbackQuery.isFetching);
  }, [query.isLoading, fallbackQuery.isFetching, setCanvasLoading]);

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
    } else if (!query.isLoading && !fallbackQuery.isFetching) {
      setCanvasError(null);
    }
  }, [query.error, query.isLoading, fallbackQuery.isFetching, setCanvasError]);

  useEffect(() => {
    if (!ENV_ORG_ID && !getEffectiveOrgId()) {
      logOnce(
        "missing-org-id",
        "[Config] NEXT_PUBLIC_ORG_ID is not set in .env.local.\n" +
          "Run: pnpm db:seed  — then copy the printed ORG_ID into .env.local\n" +
          "Or leave unset: the app will auto-discover the org when the API is running.",
      );
    }
  }, []);

  useEffect(() => {
    if (query.isError && query.error instanceof Error) {
      if (query.error.message === "Org not found") {
        logOnce(
          "org-not-found",
          `[Config] API returned "Org not found" for ORG_ID="${ENV_ORG_ID || getEffectiveOrgId()}".\n` +
            "This usually means the DB was re-seeded and .env.local has a stale UUID.\n" +
            "Auto-healing via /api/orgs/first…",
        );
      }
    }
  }, [query.isError, query.error]);

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
    setNodes((prev) => mergeGraphNodes(prev, nodes));
    setEdges(edges);
  }, [query.data, query.isSuccess, setNodes, setEdges]);

  return query;
}
