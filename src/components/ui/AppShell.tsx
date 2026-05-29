"use client";

import { useUIStore } from "@/stores/ui.store";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { GanttView } from "@/components/views/GanttView";
import { DashboardView } from "@/components/views/DashboardView";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";
import { TopBar } from "./TopBar";
import { GlobalCommandOrchestrator } from "./GlobalCommandOrchestrator";
import { CommandPalette } from "@/components/panels/CommandPalette";
import { useCanvasEvents } from "@/lib/firebase/useCanvasEvents";
import { useOrgGraph } from "@/lib/api/useOrgGraph";
import { PresenceOrchestrator } from "./PresenceOrchestrator";
import { KeyboardHelpOverlay } from "./KeyboardHelpOverlay";
import { ToastContainer } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { ProductionBootstrap } from "./ProductionBootstrap";

function CanvasEventListener() {
  useCanvasEvents();
  return null;
}

function OrgGraphHydrator() {
  useOrgGraph();
  return null;
}

export function AppShell() {
  const activeView = useUIStore((s) => s.activeView);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0E0D0C]">
      <ProductionBootstrap />
      <GlobalCommandOrchestrator />
      <OrgGraphHydrator />
      <PresenceOrchestrator />
      <CanvasEventListener />
      <CommandPalette />
      <KeyboardHelpOverlay />
      <ToastContainer />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        {activeView === "canvas" ? (
          <ErrorBoundary fallbackLabel="Canvas failed to load">
            <CanvasArea />
          </ErrorBoundary>
        ) : activeView === "gantt" ? (
          <ErrorBoundary fallbackLabel="Gantt view failed to load">
            <GanttView />
          </ErrorBoundary>
        ) : activeView === "dashboard" ? (
          <ErrorBoundary fallbackLabel="Dashboard failed to load">
            <DashboardView />
          </ErrorBoundary>
        ) : null}
        <ErrorBoundary fallbackLabel="Panel failed to load">
          <RightPanel />
        </ErrorBoundary>
      </div>
    </div>
  );
}
