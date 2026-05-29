"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useUIStore } from "@/stores/ui.store";
import { getUserColor } from "@/lib/presence/userColor";

const IDLE_MS = 5000;

export function RemoteCursors() {
  const presenceUsers = useUIStore((s) => s.presenceUsers);
  const { flowToScreenPosition } = useReactFlow();
  const lastMoveRef = useRef<Map<string, { x: number; y: number; at: number }>>(
    new Map(),
  );
  const [idleUserIds, setIdleUserIds] = useState<Set<string>>(() => new Set());

  const canvasUsers = presenceUsers.filter(
    (u) => u.isOnline && u.activeView === "canvas",
  );

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const idle = new Set<string>();
      for (const user of canvasUsers) {
        const last = lastMoveRef.current.get(user.userId);
        if (!last || now - last.at > IDLE_MS) {
          idle.add(user.userId);
        }
      }
      setIdleUserIds(idle);
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [canvasUsers]);

  return (
    <>
      {canvasUsers.map((user) => {
        const pos = flowToScreenPosition({
          x: user.cursorX,
          y: user.cursorY,
        });
        const color = getUserColor(user.userId);
        const firstName = user.name.split(" ")[0] ?? user.name;
        const prev = lastMoveRef.current.get(user.userId);
        if (
          !prev ||
          prev.x !== user.cursorX ||
          prev.y !== user.cursorY
        ) {
          lastMoveRef.current.set(user.userId, {
            x: user.cursorX,
            y: user.cursorY,
            at: Date.now(),
          });
        }
        const isIdle = idleUserIds.has(user.userId);

        return (
          <div
            key={user.userId}
            className="pointer-events-none fixed z-40 flex items-center gap-1.5 transition-opacity duration-500"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(2px, 2px)",
              opacity: isIdle ? 0 : 1,
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              className="shrink-0 transition-transform duration-100 ease-linear"
              aria-hidden
            >
              <path
                d="M1 1L15 7.5L7.5 10.5L4.5 19L1 1Z"
                fill={color}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="0.5"
              />
            </svg>
            <span
              className="font-mono-label whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-on-surface"
              style={{ backgroundColor: color }}
            >
              {firstName}
            </span>
          </div>
        );
      })}
    </>
  );
}
