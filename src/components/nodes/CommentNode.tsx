"use client";

import { useState } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";

export interface CommentNodeData {
  title?: string;
  content: string;
  authorName?: string;
  timestamp?: string;
  variant?: "yellow" | "teal" | "pink" | "blue";
  onChange?: (next: { title: string; content: string }) => void;
  [key: string]: unknown;
}
type CommentFlowNode = Node<CommentNodeData, "stickyNote">;

const BG: Record<NonNullable<CommentNodeData["variant"]>, string> = {
  yellow: "#2C2810",
  teal: "#0D2420",
  pink: "#2A0F18",
  blue: "#0D1A2C",
};

export default function CommentNode({
  data,
  selected,
}: NodeProps<CommentFlowNode>) {
  const variant = data.variant ?? "yellow";
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.title ?? "Note");
  const [content, setContent] = useState(data.content);

  const commit = (nextTitle = title, nextContent = content) => {
    data.onChange?.({ title: nextTitle, content: nextContent });
  };

  return (
    <div
      className="rounded-xl border border-amber-100/20 shadow-md transition-shadow hover:shadow-lg"
      style={{ backgroundColor: BG[variant], minWidth: 180, minHeight: 120 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={120}
        lineClassName="!border-amber-200/40"
        handleClassName="!h-2 !w-2 !rounded-sm !border-0 !bg-amber-100/70"
      />
      <div className="node-drag-handle cursor-move border-b border-amber-100/15 px-3 py-2">
        {isEditingTitle ? (
          <input
            className="w-full bg-transparent text-[11px] font-semibold text-amber-100 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              commit(title, content);
            }}
            autoFocus
          />
        ) : (
          <p
            className="text-[11px] font-semibold text-amber-100"
            onDoubleClick={() => setIsEditingTitle(true)}
            title="Double click to edit"
          >
            {title || "Note"}
          </p>
        )}
      </div>
      <div className="p-3">
        <textarea
          className="nodrag w-full resize-none bg-transparent text-[11px] italic leading-relaxed text-amber-100/90 outline-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => commit(title, content)}
          placeholder="Write a note..."
          rows={4}
        />
        <p className="mt-2 text-[9px] text-amber-100/60">
          {data.authorName ?? "Unknown"}
          {data.timestamp ? ` · ${data.timestamp}` : ""}
        </p>
      </div>
    </div>
  );
}
