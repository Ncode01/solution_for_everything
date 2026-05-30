"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

export type SparkDependencyEdgeData = {
  sourceStatus: string;
  isCriticalPath: boolean;
  isCrossPhase: boolean;
  sourcePhaseId?: string;
  targetPhaseId?: string;
  dimmed?: boolean;
  highlighted?: boolean;
};

export const SparkDependencyEdge = memo(function SparkDependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style = {},
}: EdgeProps) {
  const edgeData = (data ?? {}) as SparkDependencyEdgeData;
  const borderRadius = edgeData.isCrossPhase ? 20 : 8;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius,
  });

  let stroke = edgeData.isCrossPhase
    ? "rgba(255,255,255,0.2)"
    : "rgba(255,255,255,0.12)";
  let strokeWidth = 1.5;
  let strokeDasharray: string | undefined;

  if (edgeData.isCriticalPath) {
    stroke = "rgba(232,175,52,0.7)";
    strokeWidth = 2.5;
    strokeDasharray = "8 4";
  } else if (edgeData.sourceStatus === "done") {
    stroke = "rgba(109,170,69,0.5)";
    strokeWidth = 2;
  } else if (edgeData.sourceStatus === "in_progress") {
    stroke = "rgba(85,145,199,0.6)";
    strokeWidth = 2;
  }

  const opacity = edgeData.dimmed ? 0.05 : edgeData.highlighted ? 1 : undefined;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke,
        strokeWidth,
        strokeDasharray,
        opacity,
      }}
    />
  );
});
