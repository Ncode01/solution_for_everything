import { create } from "zustand";
import { useCanvasStore } from "@/stores/canvas.store";
import type { PresenceUser } from "@/lib/firebase/usePresence";

export type AppView =
  | "canvas"
  | "tasks"
  | "posters"
  | "budget"
  | "team"
  | "schools"
  | "dashboard"
  | "gantt";

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

export interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isRightPanelOpen: boolean;
  rightPanelMode: RightPanelMode;
  taskCreateDefaults: TaskCreateDefaults | null;
  commandQuery: string;
  activeView: AppView;
  sidebarCollapsed: boolean;
  isFocusMode: boolean;
  isCanvasLoading: boolean;
  canvasError: string | null;
  skipInitialFitView: boolean;
  presenceUsers: PresenceUser[];
  broadcastCursor: ((x: number, y: number) => void) | null;
  broadcastViewport: ((x: number, y: number, zoom: number) => void) | null;
  showKeyboardHelp: boolean;
  toasts: ToastMessage[];
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
  setActiveView: (view: AppView) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  toggleFocusMode: () => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  setBroadcastCursor: (fn: ((x: number, y: number) => void) | null) => void;
  setBroadcastViewport: (
    fn: ((x: number, y: number, zoom: number) => void) | null,
  ) => void;
  toggleKeyboardHelp: (open?: boolean) => void;
  addToast: (type: ToastMessage["type"], message: string) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isRightPanelOpen: false,
  rightPanelMode: "closed",
  taskCreateDefaults: null,
  commandQuery: "",
  activeView: "canvas",
  sidebarCollapsed: false,
  isFocusMode: false,
  isCanvasLoading: false,
  canvasError: null,
  skipInitialFitView: false,
  presenceUsers: [],
  broadcastCursor: null,
  broadcastViewport: null,
  showKeyboardHelp: false,
  toasts: [],
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
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setPresenceUsers: (presenceUsers) => set({ presenceUsers }),
  setBroadcastCursor: (broadcastCursor) => set({ broadcastCursor }),
  setBroadcastViewport: (broadcastViewport) => set({ broadcastViewport }),
  toggleKeyboardHelp: (open) =>
    set((state) => ({
      showKeyboardHelp: open !== undefined ? open : !state.showKeyboardHelp,
    })),
  addToast: (type, message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `toast-${Date.now()}-${Math.random()}`, type, message },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
