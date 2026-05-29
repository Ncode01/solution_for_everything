"use client";

import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { useCurrentUser } from "@/lib/api/useCurrentUser";
import { formatQueryError } from "@/lib/formatQueryError";
import { focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import { loadLevelFromTaskCount, LOAD_LEVEL_DOT } from "@/lib/userLoadLevel";
import { useUIStore } from "@/stores/ui.store";
import type { ProjectAccentColor } from "@/types";

const accentDot: Record<ProjectAccentColor, string> = {
  coral: "bg-coral",
  amber: "bg-amber",
  violet: "bg-violet",
  sky: "bg-sky",
  mint: "bg-mint",
};

export function LeftSidebar() {
  const query = useOrgGraphData();
  const { domainUser, session } = useCurrentUser();
  const setActiveView = useUIStore((s) => s.setActiveView);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const projects = useMemo(
    () =>
      (query.data?.projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        color: (p.color as ProjectAccentColor) ?? "sky",
      })),
    [query.data?.projects],
  );

  const people = useMemo(() => {
    if (!query.data) return [];
    const taskCountByUser: Record<string, number> = {};
    for (const t of query.data.tasks) {
      for (const uid of t.assigneeIds) {
        taskCountByUser[uid] = (taskCountByUser[uid] ?? 0) + 1;
      }
    }
    return query.data.users.map((u) => ({
      id: u.id,
      name: u.name,
      initials: u.initials,
      loadLevel: loadLevelFromTaskCount(taskCountByUser[u.id] ?? 0),
    }));
  }, [query.data]);

  const displayName =
    domainUser?.name ?? session?.user?.name ?? "Signed in";
  const displayInitials =
    domainUser?.initials ??
    session?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    "?";

  const handleProjectClick = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveView("canvas");
    void focusCanvasNode(`project-${projectId}`);
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-surface-container py-3">
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <section>
          <h2 className="text-section-header mb-2 px-3 text-on-surface-variant">
            PROJECTS
          </h2>
          {query.isLoading ? (
            <ul className="px-3">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="mb-2 h-8 animate-pulse rounded-lg bg-white/10"
                />
              ))}
            </ul>
          ) : query.isError ? (
            <p className="text-body-sm px-3 text-on-surface-variant">
              {formatQueryError(query.error)}
            </p>
          ) : projects.length === 0 ? (
            <p className="text-body-sm px-3 text-on-surface-variant">
              No projects in this org.
            </p>
          ) : (
            <ul>
              {projects.map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => handleProjectClick(project.id)}
                      className={
                        isActive
                          ? "text-body-sm mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary"
                          : "text-body-sm mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-on-surface-variant hover:bg-white/5"
                      }
                    >
                      {isActive ? (
                        <span
                          className="h-4 w-1 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      ) : (
                        <span className="w-1 shrink-0" aria-hidden />
                      )}
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${accentDot[project.color] ?? accentDot.sky}`}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-4">
          <h2 className="text-section-header mb-2 px-3 text-on-surface-variant">
            PEOPLE
          </h2>
          {query.isLoading ? (
            <ul className="px-3">
              {[0, 1].map((i) => (
                <li
                  key={i}
                  className="mb-2 h-9 animate-pulse rounded-lg bg-white/10"
                />
              ))}
            </ul>
          ) : people.length === 0 ? (
            <p className="text-body-sm px-3 text-on-surface-variant">
              No team members yet.
            </p>
          ) : (
            <ul>
              {people.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("canvas");
                      void focusCanvasNode(`person-${person.id}`);
                    }}
                    className="text-body-sm flex w-full items-center gap-3 px-3 py-2 text-on-surface hover:bg-white/5"
                  >
                    <span className="text-body-sm flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-medium text-on-surface">
                      {person.initials}
                    </span>
                    <span className="truncate">{person.name}</span>
                    <span
                      className={`ml-auto h-2 w-2 shrink-0 rounded-full ${LOAD_LEVEL_DOT[person.loadLevel]}`}
                      title={`Load: ${person.loadLevel.replace("_", " ")}`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-auto border-t border-white/5 px-3 pt-3">
        <div className="text-body-sm flex w-full items-center gap-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-body-sm font-bold text-primary">
            {displayInitials}
          </span>
          <span className="truncate text-on-surface">{displayName}</span>
          <Settings
            size={14}
            className="ml-auto shrink-0 text-on-surface-variant"
            aria-hidden
          />
        </div>
      </div>
    </aside>
  );
}
