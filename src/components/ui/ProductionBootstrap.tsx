"use client";

import { useEffect } from "react";
import { logOnce } from "@/lib/diagnostics";

/**
 * One-time production-safe bootstrap diagnostics (console only, no UI).
 */
export function ProductionBootstrap() {
  useEffect(() => {
    logOnce("audit-app-boot", "[Audit] FlowCanvas client started");

    if (!process.env.NEXT_PUBLIC_ORG_ID) {
      logOnce(
        "audit-no-org-id",
        "[Audit] NEXT_PUBLIC_ORG_ID unset — graph and canvas APIs are disabled",
      );
    }

    if (!process.env.NEXT_PUBLIC_API_URL) {
      logOnce(
        "audit-api-url-default",
        "[Audit] NEXT_PUBLIC_API_URL unset — API client defaults to http://localhost:3001",
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logOnce(
        "audit-app-url-default",
        "[Audit] NEXT_PUBLIC_APP_URL unset — auth client defaults to http://localhost:3000",
      );
    }
  }, []);

  return null;
}
