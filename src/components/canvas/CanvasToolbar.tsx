"use client";

import { useCallback, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { colors, typography } from "@/design-system";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

export function CanvasToolbar() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const showMinimap = useCanvasStore((s) => s.showMinimap);
  const toggleMinimap = useCanvasStore((s) => s.toggleMinimap);
  const viewportZoom = useCanvasStore((s) => s.viewport.zoom);
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const [addOpen, setAddOpen] = useState(false);

  const zoomPercent = Math.round(viewportZoom * 100);

  const handleFit = useCallback(() => {
    void fitView({ duration: 300 });
  }, [fitView]);

  return (
    <div
      className="pointer-events-auto absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-[#1A1A2E]/90 px-3 py-2 shadow-2xl backdrop-blur-md"
      role="toolbar"
      aria-label="Canvas tools"
    >
      <div className="flex rounded-lg border border-white/10 p-0.5">
        <LayerButton
          label="All"
          active={activeLayer === "default"}
          onClick={() => setActiveLayer("default")}
        />
        <LayerButton
          label="Workload"
          active={activeLayer === "workload"}
          onClick={() => setActiveLayer("workload")}
        />
      </div>

      <ToolbarIconButton label="Zoom to fit" onClick={handleFit}>
        <Maximize2 size={16} />
      </ToolbarIconButton>

      <span
        className={`min-w-[3rem] text-center font-mono text-[11px] ${colors.text.secondary}`}
      >
        {zoomPercent}%
      </span>

      <ToolbarIconButton label="Zoom out" onClick={() => zoomOut()}>
        <Minus size={16} />
      </ToolbarIconButton>
      <ToolbarIconButton label="Zoom in" onClick={() => zoomIn()}>
        <Plus size={16} />
      </ToolbarIconButton>

      <div className="relative">
        <ToolbarIconButton label="Add node" onClick={() => setAddOpen((o) => !o)}>
          <Plus size={16} />
        </ToolbarIconButton>
        {addOpen ? (
          <div
            className={`absolute bottom-full left-1/2 mb-2 w-44 -translate-x-1/2 rounded-lg border py-1 shadow-lg ${colors.bg.elevated} ${colors.border.default}`}
          >
            <button
              type="button"
              className={`w-full px-3 py-2 text-left ${typography.scale.sm.class} hover:bg-white/5`}
              onClick={() => {
                setAddOpen(false);
                openTaskCreate();
              }}
            >
              New Task
            </button>
            <button
              type="button"
              className={`w-full px-3 py-2 text-left ${typography.scale.sm.class} hover:bg-white/5`}
              onClick={() => {
                setAddOpen(false);
                console.log("[CanvasToolbar] New Milestone — not yet implemented");
              }}
            >
              New Milestone
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={toggleMinimap}
        className={[
          "rounded-lg px-2 py-1",
          typography.scale.xs.class,
          showMinimap ? "bg-[#6366F1]/20 text-white" : `${colors.text.secondary} hover:bg-white/5`,
        ].join(" ")}
      >
        Map
      </button>
    </div>
  );
}

function LayerButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-2.5 py-1",
        typography.scale.xs.class,
        active
          ? "bg-[#6366F1]/25 text-white"
          : "text-[#9898B0] hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg p-1.5 ${colors.text.secondary} hover:bg-white/5 hover:text-white`}
    >
      {children}
    </button>
  );
}
