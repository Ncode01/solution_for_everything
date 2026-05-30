"use client";

import React, { useCallback, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar, Clock, Link2, Zap } from "lucide-react";
import { getUserColor } from "@/lib/presence/userColor";
import { useUpdateTaskMutation } from "@/lib/api/useTaskMutations";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import type { SparkTaskNodeData, TaskStatus } from "@/types";

const SPARK_ACCENT = "#8B5CF6";

const STATUS_CYCLE = [
  "not_started",
  "in_progress",
  "in_review",
  "done",
] as const;

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  not_started: {
    label: "· IDLE",
    bg: "rgba(255,255,255,0.06)",
    text: "#888888",
  },
  in_progress: {
    label: "▶ LIVE",
    bg: "rgba(85,145,199,0.18)",
    text: "#5591C7",
  },
  done: {
    label: "✓ DONE",
    bg: "rgba(109,170,69,0.18)",
    text: "#6DAA45",
  },
  blocked: {
    label: "✕ BLOCKED",
    bg: "rgba(221,105,116,0.18)",
    text: "#DD6974",
  },
  in_review: {
    label: "◈ REVIEW",
    bg: "rgba(232,175,52,0.18)",
    text: "#E8AF34",
  },
};

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

function nextStatus(current: string): TaskStatus {
  const idx = STATUS_CYCLE.indexOf(current as (typeof STATUS_CYCLE)[number]);
  if (idx === -1) return "not_started";
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function formatDue(due: Date): string {
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dueMeta(due: Date | undefined): { label: string; color: string } {
  if (!due) return { label: "", color: "rgba(255,255,255,0.35)" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) {
    return { label: "OVERDUE", color: "#DD6974" };
  }
  if (diffDays <= 7) {
    return { label: formatDue(due), color: "#E8AF34" };
  }
  return { label: formatDue(due), color: "rgba(255,255,255,0.35)" };
}

export const SparkTaskNode = React.memo(function SparkTaskNode({
  data,
  id,
  selected,
}: NodeProps) {
  const nodeData = data as SparkTaskNodeData;
  const { task, assignees, isCriticalPath, phaseLocked, upstreamPendingCount } =
    nodeData;

  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const addToast = useUIStore((s) => s.addToast);
  const updateTask = useUpdateTaskMutation({
    onSuccess: () => addToast("success", "Status updated"),
    onError: () => addToast("error", "Could not update status"),
  });

  const isDone = task.status === "done";
  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE.not_started;
  const due = dueMeta(task.dueDate);
  const showDeps =
    upstreamPendingCount > 0 && task.status !== "done";

  const accentColor = isDone ? "#6DAA45" : SPARK_ACCENT;

  const handleCardClick = useCallback(() => {
    selectNode(`task-${task.id}`, "task", { focus: false });
    openTaskView();
  }, [task.id, selectNode, openTaskView]);

  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (phaseLocked) return;
      const status = nextStatus(task.status);
      void updateTask.mutate({ taskId: task.id, body: { status } });
    },
    [phaseLocked, task.id, task.status, updateTask],
  );

  const avatarStack = useMemo(() => {
    const visible = assignees.slice(0, 3);
    const extra = assignees.length - visible.length;
    return { visible, extra };
  }, [assignees]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => handleKeyboardActivate(e, handleCardClick)}
      aria-label={`Task: ${task.title}`}
      className={[
        "group relative w-[200px] min-h-[140px] cursor-pointer rounded-2xl border transition-all duration-150",
        "hover:-translate-y-[3px] hover:scale-[1.01] hover:border-[rgba(255,255,255,0.18)]",
        nodeData.showUnlockPulse ? "spark-task-unlock" : "",
        nodeData.isUpstreamHighlighted
          ? "ring-1 ring-[rgba(139,92,246,0.45)]"
          : "",
        selected || nodeData.isSelected
          ? "outline outline-2 outline-[rgba(139,92,246,0.7)] outline-offset-[3px]"
          : "",
        phaseLocked ? "opacity-40" : "",
        nodeData.dimmedNonCritical ? "opacity-25" : "",
        isDone && !nodeData.dimmedNonCritical ? "opacity-45" : "",
        isCriticalPath
          ? "shadow-[0_0_0_1px_rgba(232,175,52,0.5),0_4px_24px_rgba(0,0,0,0.4)]"
          : "shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
      ].join(" ")}
      style={{
        background: "rgba(18, 17, 28, 0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: isCriticalPath
          ? "0 0 0 1px rgba(232,175,52,0.5), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div
        className={[
          "absolute bottom-2 left-0 top-2 w-1 rounded-l-2xl",
          isCriticalPath ? "spark-critical-stripe" : "",
        ].join(" ")}
        style={{ backgroundColor: accentColor }}
      />

      {(task.priority === "critical" || task.priority === "high") && (
        <div className="absolute left-3 top-2.5 flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                task.priority === "critical" ? "#DD6974" : "#E8AF34",
            }}
          />
          <span
            className="text-[9px] font-bold"
            style={{
              color: task.priority === "critical" ? "#DD6974" : "#E8AF34",
            }}
          >
            {task.priority === "critical" ? "!!!" : "HI"}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleBadgeClick}
        className={[
          "absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
          phaseLocked ? "pointer-events-none" : "",
        ].join(" ")}
        style={{ background: badge.bg, color: badge.text }}
      >
        {badge.label}
      </button>

      <div className="px-4 pb-3 pt-8">
        <div className="flex items-start gap-1">
          {isCriticalPath ? (
            <Zap size={11} className="mt-0.5 shrink-0 text-[#E8AF34]" />
          ) : null}
          <span
            className={[
              "line-clamp-2 text-[13px] font-semibold leading-snug text-[#F1F1F5]",
              isDone ? "line-through" : "",
            ].join(" ")}
          >
            {task.title}
          </span>
        </div>

        {showDeps ? (
          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-[rgba(232,175,52,0.6)]">
            <Link2 size={10} />
            <span>
              {upstreamPendingCount} dep
              {upstreamPendingCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex items-center">
              {avatarStack.visible.map((user, i) => (
                <span
                  key={user.id}
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[rgba(18,17,28,0.9)] text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: getUserColor(user.id),
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: 10 - i,
                  }}
                  title={user.name}
                >
                  {user.initials.slice(0, 2)}
                </span>
              ))}
              {avatarStack.extra > 0 ? (
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[rgba(18,17,28,0.9)] bg-white/10 text-[9px] font-bold text-white"
                  style={{ marginLeft: -8 }}
                >
                  +{avatarStack.extra}
                </span>
              ) : null}
            </div>
            {task.effortEstimate != null ? (
              <span className="flex items-center gap-0.5 text-[10px] text-[rgba(255,255,255,0.25)]">
                <Clock size={10} />
                {task.effortEstimate}h
              </span>
            ) : null}
          </div>
          {task.dueDate ? (
            <span
              className="flex shrink-0 items-center gap-0.5 text-[10px]"
              style={{ color: due.color }}
            >
              <Calendar size={10} />
              {due.label}
            </span>
          ) : null}
        </div>
      </div>

      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
});
