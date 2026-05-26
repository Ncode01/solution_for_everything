"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar, Clock } from "lucide-react";
import type { TaskCardNodeData } from "@/types";
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
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    toggleRightPanel(true);
  }, [id, selectNode, toggleRightPanel]);

  const isBlocked = nodeData.task.status === "blocked";
  const isExpanded = nodeData.isExpanded === true;
  const accentColor = COLOR_MAP[nodeData.projectColor] ?? "#5591C7";

  const formatDueDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div
      onClick={handleClick}
      className={[
        isExpanded ? "w-[280px]" : "w-[220px]",
        "cursor-pointer rounded-lg bg-surface-container transition-colors duration-150",
        isBlocked
          ? "border border-[#DD6974]/60"
          : "border border-white/[0.08] hover:border-white/20",
      ].join(" ")}
    >
      <div className="h-1 rounded-t-lg" style={{ backgroundColor: accentColor }} />

      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <div
            className={[
              "h-2 w-2 shrink-0 rounded-full",
              isBlocked ? "animate-blocked-pulse" : "",
            ].join(" ")}
            style={{
              backgroundColor: STATUS_DOT_COLOR[nodeData.task.status],
            }}
          />
          <span className="text-body-sm flex-1 truncate font-medium text-on-surface">
            {nodeData.task.title}
          </span>
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

        {isExpanded && nodeData.task.description && (
          <p className="text-body-sm mt-1 line-clamp-2 text-on-surface-variant">
            {nodeData.task.description}
          </p>
        )}

        {isExpanded && nodeData.task.dueDate && (
          <div className="mt-2 flex items-center gap-1">
            <Calendar size={10} className="shrink-0 text-on-surface-variant" />
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {formatDueDate(nodeData.task.dueDate)}
            </span>
          </div>
        )}

        {isExpanded && nodeData.task.effortEstimate !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            <Clock size={10} className="shrink-0 text-on-surface-variant" />
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {nodeData.task.effortEstimate}h est.
            </span>
          </div>
        )}

        {nodeData.assignees.length > 0 && (
          <div className="mt-2 flex items-center">
            {nodeData.assignees.slice(0, 2).map((user, i) => (
              <div
                key={user.id}
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full border border-surface-container bg-tertiary-container text-[8px] font-bold text-on-surface",
                  i > 0 ? "-ml-1.5" : "",
                ].join(" ")}
              >
                {user.initials.slice(0, 2)}
              </div>
            ))}
            {nodeData.assignees.length > 2 && (
              <span className="ml-1 text-[9px] text-on-surface-variant">
                +{nodeData.assignees.length - 2}
              </span>
            )}
          </div>
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
