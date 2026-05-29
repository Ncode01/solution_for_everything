"use client";

import { useUIStore } from "@/stores/ui.store";

export function useCommandPalette() {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const query = useUIStore((s) => s.commandQuery);
  const open = useUIStore((s) => s.openCommandPalette);
  const close = useUIStore((s) => s.closeCommandPalette);
  const setQuery = useUIStore((s) => s.setCommandQuery);

  return { isOpen, query, open, close, setQuery };
}
