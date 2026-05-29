"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Command,
  Grid3x3,
  HelpCircle,
  Home,
  Image,
  LayoutList,
  School,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import {
  colors,
  shellVariants,
  typography,
} from "@/design-system";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatQueryError } from "@/lib/formatQueryError";
import { focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import { useUIStore, type AppView } from "@/stores/ui.store";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { skeletonVariants } from "@/design-system/components";

const PROJECT_COLOR_DOT: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#F59E0B]",
  violet: "bg-[#8B5CF6]",
  sky: "bg-[#3B82F6]",
  mint: "bg-[#10B981]",
};

type WorkspaceItem = {
  id: AppView;
  label: string;
  icon: LucideIcon;
};

const WORKSPACE_ITEMS: WorkspaceItem[] = [
  { id: "canvas", label: "Canvas", icon: Grid3x3 },
  { id: "tasks", label: "All Tasks", icon: LayoutList },
  { id: "posters", label: "Poster Board", icon: Image },
  { id: "team", label: "Team", icon: Users },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "schools", label: "Network Schools", icon: School },
];

export function Sidebar() {
  const graph = useOrgGraphData();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const { open: openCommandPalette } = useCommandPalette();

  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );

  const projects = useMemo(() => {
    if (!graph.data) return [];
    const taskCountByProject: Record<string, number> = {};
    for (const t of graph.data.tasks) {
      taskCountByProject[t.projectId] =
        (taskCountByProject[t.projectId] ?? 0) + 1;
    }
    return graph.data.projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      taskCount: taskCountByProject[p.id] ?? 0,
      phases: graph.data!.phases.filter((ph) => ph.projectId === p.id),
    }));
  }, [graph.data]);

  const toggleProject = (projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const shellClass = collapsed ? shellVariants.sidebarCollapsed : shellVariants.sidebar;

  return (
    <aside
      className={`${shellClass} hide-scrollbar overflow-y-auto py-3`}
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-1 px-2">
        <NavItem
          collapsed={collapsed}
          icon={Home}
          label="Overview"
          active={activeView === "dashboard"}
          onClick={() => setActiveView("dashboard")}
        />
        <NavItem
          collapsed={collapsed}
          icon={Command}
          label="⌘K"
          onClick={openCommandPalette}
        />
      </nav>

      {!collapsed ? (
        <SectionHeader>PROJECTS</SectionHeader>
      ) : (
        <div className="my-2 border-t border-white/[0.06]" />
      )}

      {graph.isLoading ? (
        <div className="space-y-2 px-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-8 ${skeletonVariants.base}`} />
          ))}
        </div>
      ) : graph.isError ? (
        collapsed ? (
          <div className="flex justify-center px-2 py-1">
            <span
              className="h-2 w-2 rounded-full bg-red-500"
              title={formatQueryError(graph.error)}
            />
          </div>
        ) : (
          <div className="px-3 py-2">
            <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
              {formatQueryError(graph.error)}
            </p>
            {process.env.NODE_ENV !== "production" ? (
              <p
                className={`mt-1 break-all ${typography.scale.xs.class} ${colors.text.tertiary}`}
              >
                ORG_ID: {process.env.NEXT_PUBLIC_ORG_ID || "(empty)"}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => graph.refetch()}
              className={`mt-2 w-full rounded-lg py-1 text-center ${typography.scale.xs.class} ${colors.bg.elevated} ${colors.text.secondary} hover:bg-white/5 border ${colors.border.subtle}`}
            >
              Retry
            </button>
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-0.5 px-1">
          {projects.map((project) => {
            const expanded = expandedProjectIds.has(project.id);
            const dotClass =
              PROJECT_COLOR_DOT[project.color] ?? PROJECT_COLOR_DOT.sky;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      setActiveView("canvas");
                      void focusCanvasNode(`project-${project.id}`);
                      return;
                    }
                    toggleProject(project.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 ${typography.scale.sm.class} ${colors.text.primary} hover:bg-[#1F1F2E]`}
                  title={collapsed ? project.name : undefined}
                >
                  {!collapsed ? (
                    expanded ? (
                      <ChevronDown size={14} className={colors.text.tertiary} />
                    ) : (
                      <ChevronRight size={14} className={colors.text.tertiary} />
                    )
                  ) : null}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {project.name}
                      </span>
                      <span
                        className={`${typography.scale.xs.class} rounded-full px-1.5 py-0.5 ${colors.bg.elevated} ${colors.text.tertiary}`}
                      >
                        {project.taskCount}
                      </span>
                    </>
                  )}
                </button>
                {!collapsed && expanded ? (
                  <ul className="ml-6 border-l border-white/[0.06] pl-2">
                    <SubNavItem
                      label="Phases"
                      onClick={() => {
                        setActiveView("canvas");
                        void focusCanvasNode(`project-${project.id}`);
                      }}
                    />
                    <SubNavItem
                      label="Tasks"
                      onClick={() => setActiveView("tasks")}
                    />
                    <SubNavItem
                      label="Posters"
                      onClick={() => setActiveView("posters")}
                    />
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {!collapsed ? (
        <SectionHeader>WORKSPACE</SectionHeader>
      ) : (
        <div className="my-2 border-t border-white/[0.06]" />
      )}

      <nav className="flex flex-col gap-0.5 px-2">
        {WORKSPACE_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            collapsed={collapsed}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
        <NavItem
          collapsed={collapsed}
          icon={Building2}
          label="Partners"
          active={activeView === "team"}
          onClick={() => setActiveView("team")}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-white/[0.06] px-2 pt-3">
        <NavItem
          collapsed={collapsed}
          icon={Settings}
          label="Settings"
          active={activeView === "settings"}
          onClick={() => setActiveView("settings")}
        />
        <NavItem
          collapsed={collapsed}
          icon={HelpCircle}
          label="Help"
          onClick={() => useUIStore.getState().toggleKeyboardHelp(true)}
        />
      </div>
    </aside>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <h2
      className={`mt-4 mb-1 px-3 ${typography.sectionHeader} ${colors.text.tertiary}`}
    >
      {children}
    </h2>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={[
        "flex w-full items-center gap-2 rounded-lg px-2 py-2",
        typography.scale.sm.class,
        active
          ? "bg-[#6366F1]/15 text-[#F1F1F5]"
          : `${colors.text.secondary} hover:bg-[#1F1F2E] hover:text-[#F1F1F5]`,
        collapsed ? "justify-center" : "",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

function SubNavItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-md px-2 py-1 text-left ${typography.scale.xs.class} ${colors.text.secondary} hover:bg-[#1F1F2E] hover:text-[#F1F1F5]`}
      >
        {label}
      </button>
    </li>
  );
}
