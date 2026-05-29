"use client";

import { useMemo, useState } from "react";
import { School, X } from "lucide-react";
import { colors, typography } from "@/design-system";
import { skeletonVariants } from "@/design-system/components";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import type { ApiNetworkSchool } from "@/lib/api/types";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { formatQueryError } from "@/lib/formatQueryError";

const PROJECT_COLOR_DOT: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#E8AF34]",
  violet: "bg-[#A86FDF]",
  sky: "bg-[#5591C7]",
  mint: "bg-[#6DAA45]",
};

export function SchoolsView() {
  const graph = useOrgGraphData();
  const schools = graph.data?.schools ?? [];
  const projects = graph.data?.projects ?? [];
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ApiNetworkSchool | null>(null);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const s of schools) {
      if (s.province) set.add(s.province);
    }
    return [...set].sort();
  }, [schools]);

  const filtered = useMemo(() => {
    if (provinceFilter === "all") return schools;
    return schools.filter((s) => s.province === provinceFilter);
  }, [schools, provinceFilter]);

  if (graph.isLoading) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-10 ${skeletonVariants.base}`} />
        ))}
      </div>
    );
  }

  if (graph.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(graph.error)}
        onRetry={() => graph.refetch()}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header
        className={`flex flex-wrap items-center gap-3 border-b px-6 py-4 ${colors.border.subtle}`}
      >
        <h1 className={`${typography.scale.lg.class} ${colors.text.primary}`}>
          Network Schools
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 ${typography.scale.xs.class} ${colors.bg.elevated} ${colors.text.secondary}`}
        >
          {schools.length}
        </span>
        <div className="flex flex-wrap gap-2">
          <ProvincePill
            label="All provinces"
            active={provinceFilter === "all"}
            onClick={() => setProvinceFilter("all")}
          />
          {provinces.map((p) => (
            <ProvincePill
              key={p}
              label={p}
              active={provinceFilter === p}
              onClick={() => setProvinceFilter(p)}
            />
          ))}
        </div>
      </header>

      <div className="hide-scrollbar flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
            <School size={40} className={colors.text.tertiary} />
            <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
              No network schools yet
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr
                className={`border-b ${colors.border.subtle} ${typography.scale.xs.class} ${colors.text.tertiary} uppercase tracking-wide`}
              >
                <th className="px-6 py-3 font-medium">School Name</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Province</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Projects</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((school) => (
                <tr
                  key={school.id}
                  onClick={() => setSelected(school)}
                  className={`cursor-pointer border-b border-white/[0.04] ${typography.scale.sm.class} hover:bg-white/[0.03]`}
                >
                  <td className={`px-6 py-3 ${colors.text.primary}`}>
                    {school.name}
                  </td>
                  <td className={`px-4 py-3 ${colors.text.secondary}`}>
                    {school.district ?? "—"}
                  </td>
                  <td className={`px-4 py-3 ${colors.text.secondary}`}>
                    {school.province ?? "—"}
                  </td>
                  <td className={`px-4 py-3 ${colors.text.secondary}`}>
                    {school.contactName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={school.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {school.projectIds.map((pid) => {
                        const project = projects.find((p) => p.id === pid);
                        if (!project) return null;
                        return (
                          <span
                            key={pid}
                            title={project.name}
                            className={`h-2 w-2 rounded-full ${PROJECT_COLOR_DOT[project.color] ?? PROJECT_COLOR_DOT.sky}`}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <SchoolDrawer
          school={selected}
          projects={projects}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function ProvincePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1",
        typography.scale.sm.class,
        active
          ? "bg-[#6366F1]/20 text-[#F1F1F5]"
          : `${colors.bg.elevated} ${colors.text.secondary} hover:bg-white/5`,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${active ? "bg-[#6DAA45]" : "bg-[#E8AF34]"}`}
      />
      <span className={colors.text.secondary}>{active ? "active" : "inactive"}</span>
    </span>
  );
}

function SchoolDrawer({
  school,
  projects,
  onClose,
}: {
  school: ApiNetworkSchool;
  projects: { id: string; name: string; color: string }[];
  onClose: () => void;
}) {
  const linked = school.projectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-20 bg-black/40"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 z-30 flex h-full w-[360px] flex-col border-l shadow-2xl ${colors.bg.elevated} ${colors.border.default}`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <h2 className={`${typography.scale.md.class} ${colors.text.primary}`}>
            {school.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 ${colors.text.tertiary} hover:text-white`}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="hide-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
          <DetailRow label="District" value={school.district ?? "—"} />
          <DetailRow label="Province" value={school.province ?? "—"} />
          <DetailRow label="Contact" value={school.contactName ?? "—"} />
          {school.contactEmail ? (
            <p className={typography.scale.sm.class}>
              <a
                href={`mailto:${school.contactEmail}`}
                className="text-primary hover:underline"
              >
                {school.contactEmail}
              </a>
            </p>
          ) : null}
          <div>
            <p className={`mb-1 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
              Status
            </p>
            <StatusBadge status={school.status} />
          </div>
          <div>
            <p className={`mb-2 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
              Linked projects
            </p>
            <ul className="space-y-1">
              {linked.map((p) =>
                p ? (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 ${typography.scale.sm.class} ${colors.text.primary}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${PROJECT_COLOR_DOT[p.color] ?? PROJECT_COLOR_DOT.sky}`}
                    />
                    {p.name}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
        {label}
      </p>
      <p className={`${typography.scale.sm.class} ${colors.text.primary}`}>
        {value}
      </p>
    </div>
  );
}
