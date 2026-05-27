"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkloadBar } from "@/lib/dashboard/dashboardUtils";

interface WorkloadChartProps {
  data: WorkloadBar[];
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  const hasOverload = data.some((d) => d.totalEffortHours > 80);

  const chartData = data.map((row) => ({
    name: row.initials,
    "byStatus.done": row.byStatus.done,
    "byStatus.in_progress": row.byStatus.in_progress,
    "byStatus.in_review": row.byStatus.in_review,
    "byStatus.not_started": row.byStatus.not_started,
    "byStatus.blocked": row.byStatus.blocked,
  }));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface-container p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-section-header text-on-surface-variant uppercase">
          Workload
        </h2>
        {hasOverload ? (
          <span className="rounded-full border border-error/30 bg-error/10 px-3 py-1 text-xs text-error">
            Overload detected
          </span>
        ) : null}
      </div>

      <ResponsiveContainer
        width="100%"
        height={Math.max(160, data.length * 44)}
      >
        <BarChart data={chartData} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#1A1916",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar
            dataKey="byStatus.done"
            name="Done"
            stackId="a"
            fill="rgba(52,211,153,0.5)"
          />
          <Bar
            dataKey="byStatus.in_progress"
            name="In Progress"
            stackId="a"
            fill="rgba(99,102,241,0.6)"
          />
          <Bar
            dataKey="byStatus.in_review"
            name="In Review"
            stackId="a"
            fill="rgba(167,139,250,0.5)"
          />
          <Bar
            dataKey="byStatus.not_started"
            name="Not Started"
            stackId="a"
            fill="rgba(255,255,255,0.1)"
          />
          <Bar
            dataKey="byStatus.blocked"
            name="Blocked"
            stackId="a"
            fill="rgba(239,68,68,0.5)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
