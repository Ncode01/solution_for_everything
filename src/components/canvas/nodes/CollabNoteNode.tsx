"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TaskCardNodeData, User } from "@/types";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

type NoteData = TaskCardNodeData & {
  note?: string | null;
  noteAuthorUser?: User | null;
};

export const CollabNoteNode = React.memo(function CollabNoteNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as NoteData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const author = nodeData.noteAuthorUser;

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="relative w-[200px] rounded-lg bg-[#2C2810] p-3 shadow-md"
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-0 w-0"
          style={{
            borderWidth: 16,
            borderStyle: "solid",
            borderColor: "transparent #1A1600 #1A1600 transparent",
          }}
        />
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A1600] text-[9px] font-bold text-amber-100/80">
            {author?.initials.slice(0, 2) ?? "?"}
          </div>
          <div>
            <p className="text-[10px] font-medium text-amber-100/90">
              {author?.name ?? "Collaborator"}
            </p>
            <p className="text-[9px] text-amber-100/50">· just now</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] italic leading-relaxed text-amber-100/80">
          {nodeData.note}
        </p>
        <p className="mt-2 truncate text-[9px] text-amber-100/40">
          re: {nodeData.task.title}
        </p>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
