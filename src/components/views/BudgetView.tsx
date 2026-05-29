"use client";

import { useMemo } from "react";
import { colors, typography, skeletonVariants } from "@/design-system";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatRs } from "@/lib/utils/formatRs";
import { formatQueryError } from "@/lib/formatQueryError";

export function BudgetView() {
  const graph = useOrgGraphData();

  const totals = useMemo(() => {
    const budget = graph.data?.budgetByProject;
    if (!budget) return { income: 0, expenditure: 0, surplus: 0 };
    let income = 0;
    let expenditure = 0;
    for (const { summary } of Object.values(budget)) {
      income += summary.totalIncome;
      expenditure += summary.totalExpenditure;
    }
    return {
      income,
      expenditure,
      surplus: income - expenditure,
    };
  }, [graph.data?.budgetByProject]);

  if (graph.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className={`h-[72px] ${skeletonVariants.base}`} />
        <div className={`h-40 ${skeletonVariants.base}`} />
      </div>
    );
  }

  if (graph.isError) {
    return (
      <p className={`p-6 ${typography.scale.sm.class} ${colors.text.secondary}`}>
        {formatQueryError(graph.error)}
      </p>
    );
  }

  const projectBudget = graph.data?.budgetByProject ?? {};
  const projects = graph.data?.projects ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={`flex h-[72px] shrink-0 items-center gap-8 border-b px-6 ${colors.bg.elevated} ${colors.border.subtle}`}
      >
        <SummaryMetric label="Total Income" value={formatRs(totals.income)} positive />
        <SummaryMetric
          label="Total Expenditure"
          value={formatRs(totals.expenditure)}
          positive={false}
        />
        <SummaryMetric
          label="Surplus / Deficit"
          value={formatRs(totals.surplus)}
          positive={totals.surplus >= 0}
        />
      </div>
      <div className="hide-scrollbar flex-1 overflow-y-auto p-6">
        {projects.length === 0 ? (
          <p className={typography.scale.sm.class + " " + colors.text.secondary}>
            No budget entries yet.
          </p>
        ) : (
          projects.map((project) => {
            const section = projectBudget[project.id];
            if (!section) return null;
            return (
              <section key={project.id} className="mb-8">
                <h2
                  className={`mb-3 flex items-center gap-2 ${typography.scale.md.class} ${colors.text.primary}`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                  {project.name}
                  <span className={typography.scale.xs.class + " " + colors.text.tertiary}>
                    {formatRs(section.summary.surplus)}
                  </span>
                </h2>
                <table className="w-full text-left">
                  <thead>
                    <tr className={typography.scale.xs.class + " " + colors.text.tertiary}>
                      <th className="pb-2 pr-4">Label</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4 text-right">Total</th>
                      <th className="pb-2">Confirmed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`border-t border-white/[0.06] ${typography.scale.sm.class} ${colors.text.primary}`}
                      >
                        <td className="py-2 pr-4">{entry.label}</td>
                        <td className={`py-2 pr-4 capitalize ${colors.text.secondary}`}>
                          {entry.type}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono text-[12px]">
                          {formatRs(entry.amount)}
                        </td>
                        <td className="py-2">{entry.confirmed ? "✓" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div>
      <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>{label}</p>
      <p
        className={`${typography.scale.lg.class} ${
          positive ? colors.status.done : colors.status.blocked
        }`}
      >
        {value}
      </p>
    </div>
  );
}
