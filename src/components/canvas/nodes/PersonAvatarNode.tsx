"use client";

import React, { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import type { PersonAvatarNodeData } from "@/types";
import { useCanvasStore } from "@/stores/canvas.store";

const LOAD_STYLES: Record<
  string,
  { avatar: string; ring: string }
> = {
  available: {
    avatar: "bg-[#6DAA45]/20 text-[#6DAA45]",
    ring: "ring-[#6DAA45]",
  },
  at_capacity: {
    avatar: "bg-[#E8AF34]/20 text-[#E8AF34]",
    ring: "ring-[#E8AF34]",
  },
  overloaded: {
    avatar: "bg-[#DD6974]/20 text-[#DD6974]",
    ring: "ring-[#DD6974]",
  },
};

export const PersonAvatarNode = React.memo(function PersonAvatarNode({
  data,
}: NodeProps) {
  const nodeData = data as PersonAvatarNodeData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const styles = LOAD_STYLES[nodeData.user.loadLevel] ?? LOAD_STYLES.available;

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
            "flex h-12 w-12 items-center justify-center rounded-full text-body-md font-bold ring-2 ring-offset-1 ring-offset-[#0E0D0C]",
            styles.avatar,
            styles.ring,
          ].join(" ")}
        >
          {nodeData.user.initials.slice(0, 2)}
        </div>
      </div>
      <p className="text-body-sm mt-1.5 text-center text-on-surface">
        {nodeData.user.name}
      </p>
      <span className="font-mono-label mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-on-surface-variant">
        {nodeData.user.taskCount} tasks
      </span>
    </div>
  );
});
