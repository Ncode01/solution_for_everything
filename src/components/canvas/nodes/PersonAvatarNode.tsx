"use client";

import React, { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import type { PersonAvatarNodeData } from "@/types";
import { colors, typography } from "@/design-system";
import { getUserColor } from "@/lib/presence/userColor";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

export const PersonAvatarNode = React.memo(function PersonAvatarNode({
  data,
}: NodeProps) {
  const nodeData = data as PersonAvatarNodeData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const presenceUsers = useUIStore((s) => s.presenceUsers);
  const isOnline = presenceUsers.some(
    (u) => u.userId === nodeData.user.id && u.isOnline,
  );
  const avatarColor = getUserColor(nodeData.user.id);
  const projectColor = nodeData.projectIds[0]
    ? "#5591C7"
    : "#6366F1";

  const handleClick = useCallback(() => {
    selectNode(`person-${nodeData.user.id}`, "person");
  }, [selectNode, nodeData.user.id]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="flex cursor-pointer flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="relative">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full text-white ring-2 ring-offset-2 ring-offset-[#0E0D0C]",
            isOnline ? "animate-pulse ring-primary" : "ring-white/10",
          ].join(" ")}
          style={{ backgroundColor: avatarColor }}
        >
          <span className={typography.scale.sm.class}>
            {nodeData.user.initials.slice(0, 2)}
          </span>
        </div>
        <span
          className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
          style={{ backgroundColor: projectColor }}
        >
          {nodeData.user.taskCount}
        </span>
      </div>
      <p className={`mt-1.5 text-center ${typography.scale.xs.class} ${colors.text.secondary}`}>
        {nodeData.user.name}
      </p>
      <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
        {nodeData.user.role}
      </p>
    </div>
  );
});
