"use client";

import { useUIStore } from "@/stores/ui.store";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";
import { TopBar } from "./TopBar";
import { GlobalCommandOrchestrator } from "./GlobalCommandOrchestrator";
import { CommandPalette } from "@/components/panels/CommandPalette";
import { useCanvasEvents } from "@/lib/firebase/useCanvasEvents";

function CanvasEventListener() {
  useCanvasEvents();
  return null;
}

export function AppShell() {
  const activeView = useUIStore((s) => s.activeView);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0E0D0C]">
      <GlobalCommandOrchestrator />
      <CanvasEventListener />
      <CommandPalette />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        {activeView === "canvas" ? (
          <CanvasArea />
        ) : (
          <main className="flex flex-1 items-center justify-center">
            <p className="font-mono-label text-mono-label text-outline">
              {activeView === "dashboard"
                ? "Dashboard — Phase 4"
                : "Gantt — Phase 5"}
            </p>
          </main>
        )}
        <RightPanel />
      </div>
    </div>
  );
}
