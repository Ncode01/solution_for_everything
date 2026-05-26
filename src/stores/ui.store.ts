import { create } from "zustand";

interface UIState {
  isCommandPaletteOpen: boolean;
  isRightPanelOpen: boolean;
  commandQuery: string;
  activeView: "canvas" | "dashboard" | "gantt";
  isFocusMode: boolean;
  isCanvasLoading: boolean;
  canvasError: string | null;
  setCanvasLoading: (isCanvasLoading: boolean) => void;
  setCanvasError: (canvasError: string | null) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  toggleRightPanel: (open?: boolean) => void;
  setActiveView: (view: UIState["activeView"]) => void;
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isRightPanelOpen: false,
  commandQuery: "",
  activeView: "canvas",
  isFocusMode: false,
  isCanvasLoading: false,
  canvasError: null,
  setCanvasLoading: (isCanvasLoading) => set({ isCanvasLoading }),
  setCanvasError: (canvasError) => set({ canvasError }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () =>
    set({ isCommandPaletteOpen: false, commandQuery: "" }),
  setCommandQuery: (commandQuery) => set({ commandQuery }),
  toggleRightPanel: (open) =>
    set((state) => ({
      isRightPanelOpen: open !== undefined ? open : !state.isRightPanelOpen,
    })),
  setActiveView: (activeView) => set({ activeView }),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
}));
