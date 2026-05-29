"use client";

import { useMemo, useState } from "react";
import type { GanttBarLayout } from "@/lib/gantt/ganttUtils";

interface GanttDependencyArrowsProps {
  layouts: GanttBarLayout[];
  columnWidth: number;
  rowHeight: number;
  width: number;
  height: number;
}

export function GanttDependencyArrows({
  layouts,
  columnWidth,
  rowHeight,
  width,
  height,
}: GanttDependencyArrowsProps) {
  const [hoveredDep, setHoveredDep] = useState<string | null>(null);
  const layoutByTaskId = useMemo(
    () => new Map(layouts.map((l) => [l.taskId, l])),
    [layouts],
  );

  const arrows = useMemo(() => {
    const paths: {
      key: string;
      d: string;
      upstreamId: string;
      downstreamId: string;
    }[] = [];

    for (const layout of layouts) {
      for (const upstreamId of layout.dependencies) {
        const upstream = layoutByTaskId.get(upstreamId);
        if (!upstream) continue;

        const x1 = (upstream.startDay + upstream.durationDays) * columnWidth;
        const y1 = upstream.rowCenterY;
        const x2 = layout.startDay * columnWidth;
        const y2 = layout.rowCenterY;
        const midX = (x1 + x2) / 2;

        const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        paths.push({
          key: `${upstreamId}->${layout.taskId}`,
          d,
          upstreamId,
          downstreamId: layout.taskId,
        });
      }
    }
    return paths;
  }, [layouts, layoutByTaskId, columnWidth]);

  if (arrows.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 z-[5]"
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <marker
          id="gantt-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(232,175,52,0.85)" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const active = hoveredDep === arrow.key;
        return (
          <path
            key={arrow.key}
            d={arrow.d}
            fill="none"
            stroke={active ? "rgba(232,175,52,1)" : "rgba(232,175,52,0.5)"}
            strokeWidth={active ? 2 : 1.5}
            markerEnd="url(#gantt-arrowhead)"
            className="pointer-events-auto cursor-default transition-opacity"
            onMouseEnter={() => setHoveredDep(arrow.key)}
            onMouseLeave={() => setHoveredDep(null)}
          />
        );
      })}
    </svg>
  );
}
