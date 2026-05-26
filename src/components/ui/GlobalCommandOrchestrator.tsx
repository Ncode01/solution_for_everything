"use client";

import { useGlobalShortcuts } from "@/lib/commands/useGlobalShortcuts";

export function GlobalCommandOrchestrator() {
  useGlobalShortcuts();
  return null;
}
