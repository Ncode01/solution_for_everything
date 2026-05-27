import { create } from "zustand";
import { useCanvasStore } from "@/stores/canvas.store";
import type { PresenceUser } from "@/lib/firebase/usePresence";

export type RightPanelMode =
  | "closed"
  | "task-view"
  | "task-edit"
  | "task-create";

export interface TaskCreateDefaults {
  projectId: string;
  phaseId: string;
  canvasX?: number;
  canvasY?: number;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isRightPanelOpen: boolean;
  rightPanelMode: RightPanelMode;
  taskCreateDefaults: TaskCreateDefaults | null;
  commandQuery: string;
  activeView: "canvas" | "dashboard" | "gantt";
  isFocusMode: boolean;
  isCanvasLoading: boolean;
  canvasError: string | null;
  skipInitialFitView: boolean;
  presenceUsers: PresenceUser[];
  broadcastCursor: ((x: number, y: number) => void) | null;
  broadcastViewport: ((x: number, y: number, zoom: number) => void) | null;
  setCanvasLoading: (isCanvasLoading: boolean) => void;
  setCanvasError: (canvasError: string | null) => void;
  setSkipInitialFitView: (skip: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  toggleRightPanel: (open?: boolean) => void;
  openTaskView: () => void;
  openTaskEdit: () => void;
  openTaskCreate: (defaults?: TaskCreateDefaults) => void;
  closeRightPanel: () => void;
  setActiveView: (view: UIState["activeView"]) => void;
  toggleFocusMode: () => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  setBroadcastCursor: (fn: ((x: number, y: number) => void) | null) => void;
  setBroadcastViewport: (
    fn: ((x: number, y: number, zoom: number) => void) | null,
  ) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isRightPanelOpen: false,
  rightPanelMode: "closed",
  taskCreateDefaults: null,
  commandQuery: "",
  activeView: "canvas",
  isFocusMode: false,
  isCanvasLoading: false,
  canvasError: null,
  skipInitialFitView: false,
  presenceUsers: [],
  broadcastCursor: null,
  broadcastViewport: null,
  setCanvasLoading: (isCanvasLoading) => set({ isCanvasLoading }),
  setCanvasError: (canvasError) => set({ canvasError }),
  setSkipInitialFitView: (skipInitialFitView) => set({ skipInitialFitView }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () =>
    set({ isCommandPaletteOpen: false, commandQuery: "" }),
  setCommandQuery: (commandQuery) => set({ commandQuery }),
  toggleRightPanel: (open) =>
    set((state) => ({
      isRightPanelOpen: open !== undefined ? open : !state.isRightPanelOpen,
    })),
  openTaskView: () =>
    set({ isRightPanelOpen: true, rightPanelMode: "task-view" }),
  openTaskEdit: () =>
    set({ isRightPanelOpen: true, rightPanelMode: "task-edit" }),
  openTaskCreate: (defaults) =>
    set({
      isRightPanelOpen: true,
      rightPanelMode: "task-create",
      taskCreateDefaults: defaults ?? null,
    }),
  closeRightPanel: () =>
    set({
      isRightPanelOpen: false,
      rightPanelMode: "closed",
      taskCreateDefaults: null,
    }),
  setActiveView: (activeView) =>
    set((state) => {
      if (state.activeView === activeView) return { activeView };
      useCanvasStore.getState().dismissCascade();
      return {
        activeView,
        isRightPanelOpen: false,
        rightPanelMode: "closed",
        taskCreateDefaults: null,
      };
    }),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setPresenceUsers: (presenceUsers) => set({ presenceUsers }),
  setBroadcastCursor: (broadcastCursor) => set({ broadcastCursor }),
  setBroadcastViewport: (broadcastViewport) => set({ broadcastViewport }),
}));
