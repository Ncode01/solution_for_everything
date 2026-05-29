"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

const TYPE_COLORS: Record<string, string> = {
  launches_at: "#a78bfa",
  talent_pipeline: "#34d399",
  venue_shared: "#60a5fa",
  funds_from: "#fbbf24",
  collaboration: "#f472b6",
};

const TYPE_LABELS: Record<string, string> = {
  launches_at: "Launches at",
  talent_pipeline: "Talent pipeline",
  venue_shared: "Shared venue",
  funds_from: "Funds from",
  collaboration: "Collaboration",
};

export type CrossProjectEdgeData = {
  linkType: keyof typeof TYPE_COLORS;
  note?: string | null;
};

export const CrossProjectEdge = memo(function CrossProjectEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = (data ?? {}) as CrossProjectEdgeData;
  const linkType = edgeData.linkType ?? "collaboration";
  const color = TYPE_COLORS[linkType] ?? TYPE_COLORS.collaboration;
  const label = TYPE_LABELS[linkType] ?? "Collaboration";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: 1.5,
          strokeDasharray: "6 4",
          opacity: 0.6,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto rounded-full border border-white/10 bg-surface-container-high px-2 py-0.5 text-[10px] text-on-surface-variant"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          title={edgeData.note ?? undefined}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
