"use client";

import { useEffect } from "react";
import { useGlobalShortcuts } from "@/lib/commands/useGlobalShortcuts";
import { useUIStore } from "@/stores/ui.store";

/**
 * Global keyboard shortcut registry — extends command registry shortcuts
 * with layout-specific bindings ([ ] sidebar, G-chords for navigation).
 */
export function useKeyboardShortcuts() {
  useGlobalShortcuts();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (typing) return;

      if (event.key === "[" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        useUIStore.getState().setSidebarCollapsed(true);
        return;
      }

      if (event.key === "]" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        useUIStore.getState().setSidebarCollapsed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
