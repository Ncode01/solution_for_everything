"use client";

import { useMemo, useState } from "react";
import { colors, typography, skeletonVariants } from "@/design-system";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatQueryError } from "@/lib/formatQueryError";
import { initialsFromName } from "@/lib/utils/initials";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

export function TeamView() {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const graph = useOrgGraphData();
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

  const members = useMemo(() => {
    if (!graph.data) return [];
    const posterCountByUser: Record<string, number> = {};
    const taskCountByUser: Record<string, number> = {};
    for (const t of graph.data.tasks) {
      for (const uid of t.assigneeIds) {
        taskCountByUser[uid] = (taskCountByUser[uid] ?? 0) + 1;
      }
    }
    return graph.data.users.map((u) => ({
      ...u,
      taskCount: taskCountByUser[u.id] ?? 0,
      posterCount: posterCountByUser[u.id] ?? 0,
    }));
  }, [graph.data]);

  const partners = useMemo(() => {
    if (!graph.data?.partnerOrgsByProject) return [];
    const list: { id: string; orgName: string; orgRole: string; projectId: string }[] = [];
    for (const [projectId, orgs] of Object.entries(
      graph.data.partnerOrgsByProject,
    )) {
      for (const o of orgs) {
        list.push({ ...o, projectId });
      }
    }
    return list;
  }, [graph.data]);

  const openPerson = (userId: string) => {
    selectNode(`person-${userId}`, "person");
    openTaskView();
  };

  if (graph.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-32 ${skeletonVariants.base}`} />
        ))}
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={`flex gap-2 border-b px-6 py-3 ${colors.border.subtle}`}>
        <TabButton active={tab === "internal"} onClick={() => setTab("internal")}>
          Internal Committee
        </TabButton>
        <TabButton active={tab === "external"} onClick={() => setTab("external")}>
          External Partners
        </TabButton>
      </div>
      <div className="hide-scrollbar flex-1 overflow-y-auto p-6">
        {tab === "internal" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openPerson(m.id)}
                className={`rounded-xl border p-5 text-left ${colors.bg.elevated} ${colors.border.subtle} hover:bg-[#1F1F2E]`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${colors.accent.primaryMuted} ${typography.scale.sm.class} font-bold ${colors.text.primary}`}
                >
                  {m.initials || initialsFromName(m.name)}
                </div>
                <p className={`${typography.scale.lg.class} ${colors.text.primary}`}>
                  {m.name}
                </p>
                <p className={`mt-1 ${typography.scale.xs.class} ${colors.text.secondary}`}>
                  {m.role}
                </p>
                <p className={`mt-3 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
                  {m.taskCount} tasks · {m.posterCount} posters
                </p>
              </button>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className={`${typography.scale.sm.class} ${colors.text.secondary}`}>
            No external partners yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-5 ${colors.bg.elevated} ${colors.border.subtle}`}
              >
                <p className={`${typography.scale.lg.class} ${colors.text.primary}`}>
                  {p.orgName}
                </p>
                <p className={`mt-1 ${typography.scale.sm.class} ${colors.text.secondary}`}>
                  {p.orgRole}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-1.5 text-[13px] font-medium",
        active
          ? "bg-[#6366F1]/15 text-[#F1F1F5]"
          : "text-[#9898B0] hover:bg-white/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
