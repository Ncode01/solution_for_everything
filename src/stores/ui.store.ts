import { create } from "zustand";

interface UIState {
  isCommandPaletteOpen: boolean;
  isRightPanelOpen: boolean;
  activeView: "canvas" | "dashboard" | "gantt";
  isFocusMode: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleRightPanel: (open?: boolean) => void;
  setActiveView: (view: UIState["activeView"]) => void;
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isRightPanelOpen: false,
  activeView: "canvas",
  isFocusMode: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleRightPanel: (open) =>
    set((state) => ({
      isRightPanelOpen: open !== undefined ? open : !state.isRightPanelOpen,
    })),
  setActiveView: (activeView) => set({ activeView }),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
}));
