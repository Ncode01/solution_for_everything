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
      <GlobalCommandOrchestrator />
      <OrgGraphHydrator />
      <PresenceOrchestrator />
      <CanvasEventListener />
      <CommandPalette />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        {activeView === "canvas" ? (
          <CanvasArea />
        ) : activeView === "gantt" ? (
          <GanttView />
        ) : activeView === "dashboard" ? (
          <DashboardView />
        ) : null}
        <RightPanel />
      </div>
    </div>
  );
}
