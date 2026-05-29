"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OrgGraphResponse } from "./types";
import { ENV_ORG_ID, getEffectiveOrgId } from "./orgId";

/**
 * Read-only subscription to the org graph cache.
 * Does not register a fetch — relies on useOrgGraph() in AppShell.
 */
const EMPTY_ORG_ERROR = new Error("NEXT_PUBLIC_ORG_ID is not set");

export function useOrgGraphData() {
  const queryClient = useQueryClient();
  const effectiveOrgId = getEffectiveOrgId();

  const data = useSyncExternalStore(
    (onStoreChange) => {
      return queryClient.getQueryCache().subscribe((event) => {
        const key = event.query?.queryKey;
        if (key?.[0] === "org-graph") {
          onStoreChange();
        }
        if (key?.[0] === "orgs-first") {
          onStoreChange();
        }
      });
    },
    () => {
      const orgId = getEffectiveOrgId();
      if (!orgId) return undefined;
      return queryClient.getQueryData<OrgGraphResponse>(["org-graph", orgId]);
    },
    () => undefined,
  );

  if (!ENV_ORG_ID && !effectiveOrgId) {
    const fallbackState = queryClient.getQueryState(["orgs-first"]);
    if (fallbackState?.status === "pending") {
      return {
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        isFetching: true,
        dataUpdatedAt: 0,
        refetch: () => {
          void queryClient.invalidateQueries({ queryKey: ["orgs-first"] });
        },
      };
    }
    if (!fallbackState || fallbackState.status === "error") {
      return {
        data: undefined,
        isLoading: false,
        isError: true,
        error: EMPTY_ORG_ERROR,
        isFetching: false,
        dataUpdatedAt: 0,
        refetch: () => {
          void queryClient.invalidateQueries({ queryKey: ["orgs-first"] });
        },
      };
    }
  }

  const orgId = getEffectiveOrgId();
  if (!orgId) {
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: EMPTY_ORG_ERROR,
      isFetching: false,
      dataUpdatedAt: 0,
      refetch: () => {
        void queryClient.invalidateQueries({ queryKey: ["orgs-first"] });
      },
    };
  }

  const state = queryClient.getQueryState<OrgGraphResponse>([
    "org-graph",
    orgId,
  ]);

  const fallbackState = queryClient.getQueryState(["orgs-first"]);

  return {
    data,
    isLoading:
      state?.status === "pending" ||
      fallbackState?.status === "pending" ||
      fallbackState?.fetchStatus === "fetching",
    isError: state?.status === "error",
    error: state?.error ?? null,
    isFetching:
      state?.fetchStatus === "fetching" ||
      fallbackState?.fetchStatus === "fetching",
    dataUpdatedAt: state?.dataUpdatedAt ?? 0,
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", orgId] });
      if (
        state?.status === "error" &&
        state.error instanceof Error &&
        state.error.message === "Org not found"
      ) {
        void queryClient.invalidateQueries({ queryKey: ["orgs-first"] });
      }
    },
  };
}
