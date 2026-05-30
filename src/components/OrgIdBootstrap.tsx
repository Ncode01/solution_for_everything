"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markOrgBootstrapComplete, setSessionOrgId } from "@/lib/api/orgId";

export function OrgIdBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void fetch("/api/org-config")
      .then((r) => r.json())
      .then((data: { orgId: string | null; orgName?: string }) => {
        if (data.orgId) {
          setSessionOrgId(data.orgId);
          if (typeof window !== "undefined") {
            (window as Window & { __ORG_ID?: string }).__ORG_ID = data.orgId;
          }
          console.log("[OrgBootstrap] Org loaded:", data.orgName, data.orgId);
        }
      })
      .catch((err: unknown) => {
        console.warn("[OrgBootstrap] Failed to load org config:", err);
      })
      .finally(() => {
        markOrgBootstrapComplete();
        void queryClient.invalidateQueries({ queryKey: ["org-graph"] });
        void queryClient.invalidateQueries({ queryKey: ["orgs-first"] });
      });
  }, [queryClient]);

  return null;
}
