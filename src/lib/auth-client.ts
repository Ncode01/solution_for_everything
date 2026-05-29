"use client";

import { createAuthClient } from "better-auth/react";
import { logOnce } from "@/lib/diagnostics";

const authBaseURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (typeof window !== "undefined") {
  logOnce(
    "auth-client-base-url",
    `[AuthClient] baseURL resolved to ${authBaseURL}`,
  );
}

export const authClient = createAuthClient({
  baseURL: authBaseURL,
});
