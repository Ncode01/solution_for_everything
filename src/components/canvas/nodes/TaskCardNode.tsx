"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar, Check, Circle, Clock, X, Zap } from "lucide-react";
import { colors, typography } from "@/design-system";
import { getUserColor } from "@/lib/presence/userColor";
import type { TaskCardNodeData } from "@/types";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  not_started: "#4f4f4d",
  in_progress: "#5591C7",
  blocked: "#DD6974",
  in_review: "#E8AF34",
  done: "#6DAA45",
};

const PRIORITY_CLASSES: Record<string, string> = {
  critical: "bg-[#DD6974]/20 text-[#DD6974]",
  high: "bg-[#E8AF34]/20 text-[#E8AF34]",
  medium: "bg-white/10 text-on-surface-variant",
  low: "hidden",
};

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

export const TaskCardNode = React.memo(function TaskCardNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as TaskCardNodeData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  const isBlocked = nodeData.task.status === "blocked";
  const isDone = nodeData.task.status === "done";
  const isCritical = nodeData.isCriticalPath === true;
  const isDetailed =
    nodeData.detailed === true || nodeData.isExpanded === true;
  const accentColor = COLOR_MAP[nodeData.projectColor] ?? "#5591C7";
  const depCount = nodeData.task.dependencies?.length ?? 0;

  const formatDueDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
      aria-label={`Task: ${nodeData.task.title}, ${nodeData.task.status.replace("_", " ")}`}
      className={[
        "relative w-[220px] cursor-pointer rounded-lg border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        colors.bg.surface,
        isBlocked
          ? "border-[#DD6974]/60"
          : "border-white/[0.08] hover:-translate-y-px hover:border-white/20",
        isDone ? "opacity-55" : "",
        isCritical ? "shadow-[inset_3px_0_0_#E8AF34]" : "",
      ].join(" ")}
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: accentColor, opacity: 0.8 }}
      />
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
        {isCritical ? (
          <Zap size={12} className="text-[#E8AF34]" aria-label="Critical path" />
        ) : null}
        <StatusIcon status={nodeData.task.status} />
      </div>
      {isBlocked && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg bg-[#DD6974]/[0.03]"
          aria-hidden
        />
      )}
      <div className="p-3 pl-4">
        <span
          className={[
            `line-clamp-2 ${typography.scale.sm.class} font-medium text-white`,
            isDone ? "line-through opacity-60" : "",
          ].join(" ")}
        >
          {nodeData.task.title}
        </span>
        <div className="mt-2 flex items-center gap-2">
          {nodeData.assignees[0] ? (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{
                backgroundColor: getUserColor(nodeData.assignees[0].id),
              }}
            >
              {nodeData.assignees[0].initials.slice(0, 2)}
            </span>
          ) : null}
          {nodeData.task.dueDate ? (
            <span className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
              {formatDueDate(nodeData.task.dueDate)}
            </span>
          ) : null}
          {depCount > 0 ? (
            <span className={`${typography.scale.xs.class} text-[#E8AF34]`}>
              ⤵{depCount}
            </span>
          ) : null}
          {isBlocked ? (
            <span className="h-2 w-2 rounded-full bg-[#DD6974]" title="Blocked" />
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="sr-only">{nodeData.task.status}</span>
          {nodeData.task.priority !== "low" && (
            <span
              className={`font-mono-label shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase ${PRIORITY_CLASSES[nodeData.task.priority]}`}
            >
              {nodeData.task.priority === "critical"
                ? "!!!"
                : nodeData.task.priority.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>

        {isDetailed && nodeData.task.description && (
          <p className="text-body-sm mt-1 line-clamp-2 text-on-surface-variant">
            {nodeData.task.description}
          </p>
        )}

        {isDetailed && nodeData.task.dueDate && (
          <div className="mt-2 flex items-center gap-1">
            <Calendar size={10} className="shrink-0 text-on-surface-variant" />
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {formatDueDate(nodeData.task.dueDate)}
            </span>
          </div>
        )}

        {isDetailed && nodeData.task.effortEstimate !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            <Clock size={10} className="shrink-0 text-on-surface-variant" />
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {nodeData.task.effortEstimate}h est.
            </span>
          </div>
        )}

        {isDetailed && nodeData.task.dependencies.length > 0 && (
          <p className={`mt-2 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
            Depends on {nodeData.task.dependencies.length} task
            {nodeData.task.dependencies.length === 1 ? "" : "s"}
          </p>
        )}

        {nodeData.slackTime !== undefined && nodeData.slackTime > 0 && (
          <div className="mt-2">
            <span className="font-mono-label rounded-full bg-[#6DAA45]/10 px-1.5 py-0.5 text-[9px] text-[#6DAA45]">
              +{nodeData.slackTime}d float
            </span>
          </div>
        )}

        {nodeData.isCriticalPath && (
          <div className="mt-2 h-0.5 w-full rounded-b-sm bg-[#E8AF34]" />
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={HANDLE_STYLE}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={HANDLE_STYLE}
      />
    </div>
  );
});

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "done":
      return <Check size={14} className="text-[#6DAA45]" />;
    case "blocked":
      return <X size={14} className="text-[#DD6974]" />;
    case "in_progress":
      return (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <Circle size={14} className="text-primary" />
          <span className="absolute left-0 top-0 h-full w-1/2 overflow-hidden rounded-l-full bg-primary" />
        </span>
      );
    default:
      return <Circle size={14} className="text-outline" />;
  }
}
