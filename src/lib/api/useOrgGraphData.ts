"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OrgGraphResponse } from "./types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

/**
 * Read-only subscription to the org graph cache.
 * Does not register a fetch — relies on useOrgGraph() in AppShell.
 */
const EMPTY_ORG_ERROR = new Error("NEXT_PUBLIC_ORG_ID is not set");

export function useOrgGraphData() {
  const queryClient = useQueryClient();

  const data = useSyncExternalStore(
    (onStoreChange) => {
      if (!ORG_ID) return () => {};
      return queryClient.getQueryCache().subscribe((event) => {
        const key = event.query?.queryKey;
        if (key?.[0] === "org-graph" && key?.[1] === ORG_ID) {
          onStoreChange();
        }
      });
    },
    () =>
      ORG_ID
        ? queryClient.getQueryData<OrgGraphResponse>(["org-graph", ORG_ID])
        : undefined,
    () => undefined,
  );

  if (!ORG_ID) {
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: EMPTY_ORG_ERROR,
      dataUpdatedAt: 0,
      refetch: () => {},
    };
  }

  const state = queryClient.getQueryState<OrgGraphResponse>([
    "org-graph",
    ORG_ID,
  ]);

  return {
    data,
    isLoading: state?.status === "pending",
    isError: state?.status === "error",
    error: state?.error ?? null,
    dataUpdatedAt: state?.dataUpdatedAt ?? 0,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] }),
  };
}
