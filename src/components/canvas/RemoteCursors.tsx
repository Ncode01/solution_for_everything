"use client";

import { useReactFlow } from "@xyflow/react";
import { useUIStore } from "@/stores/ui.store";
import { getUserColor } from "@/lib/presence/userColor";

export function RemoteCursors() {
  const presenceUsers = useUIStore((s) => s.presenceUsers);
  const { flowToScreenPosition } = useReactFlow();

  const canvasUsers = presenceUsers.filter(
    (u) => u.isOnline && u.activeView === "canvas",
  );

  return (
    <>
      {canvasUsers.map((user) => {
        const pos = flowToScreenPosition({
          x: user.cursorX,
          y: user.cursorY,
        });
        const color = getUserColor(user.userId);
        const firstName = user.name.split(" ")[0] ?? user.name;

        return (
          <div
            key={user.userId}
            className="pointer-events-none fixed z-40 flex items-center gap-1.5"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(4px, 4px)",
            }}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path
                d="M0 0L12 5L5 8L2 14L0 0Z"
                fill={color}
              />
            </svg>
            <span
              className="font-mono-label whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ background: color }}
            >
              {firstName}
            </span>
          </div>
        );
      })}
    </>
  );
}
