"use client";

import { GitFork } from "lucide-react";

interface RightPanelProps {
  isOpen?: boolean;
}

export function RightPanel({ isOpen = false }: RightPanelProps) {
  return (
    <aside
      className={`w-[360px] shrink-0 border-l border-white/5 bg-surface-container ${isOpen ? "" : "hidden"}`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col items-center justify-center px-6">
        <GitFork size={40} className="mb-4 text-outline" strokeWidth={1.25} />
        <p className="text-body-md text-center text-on-surface-variant">
          Select a node to inspect
        </p>
        <p className="text-body-sm mt-1 text-center text-outline">
          or press T to create a new task
        </p>
      </div>
    </aside>
  );
}
