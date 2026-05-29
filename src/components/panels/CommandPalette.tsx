"use client";

import React, { useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bug,
  CheckSquare,
  Compass,
  Grid3x3,
  LayoutGrid,
  Search,
  X,
} from "lucide-react";
import { colors, shadows } from "@/design-system";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";
import { useCommandRegistry } from "@/lib/commands/useCommandRegistry";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import type { TaskCardNodeData } from "@/types";
import {
  COMMAND_GROUP_LABELS,
  type CommandDefinition,
  type CommandGroupKey,
} from "@/types/commands";
import {
  filterCommandsByQuery,
  formatShortcutLabel,
  isCommandAvailable,
  resolveActiveContexts,
} from "@/lib/commands/commandUtils";

const GROUP_ORDER: CommandGroupKey[] =
  process.env.NODE_ENV === "production"
    ? ["navigation", "view", "canvas", "tasks"]
    : ["navigation", "view", "canvas", "tasks", "debug"];

const PROJECT_COLOR_MAP: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#F59E0B]",
  violet: "bg-[#8B5CF6]",
  sky: "bg-[#3B82F6]",
  mint: "bg-[#10B981]",
};

const groupHeadingClass = [
  "[&_[cmdk-group-heading]]:px-3",
  "[&_[cmdk-group-heading]]:py-1.5",
  "[&_[cmdk-group-heading]]:text-[10px]",
  "[&_[cmdk-group-heading]]:font-semibold",
  "[&_[cmdk-group-heading]]:tracking-[0.08em]",
  "[&_[cmdk-group-heading]]:uppercase",
  `[&_[cmdk-group-heading]]:${colors.text.tertiary}`,
].join(" ");

const itemClass = [
  "flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2.5 mx-1 text-sm font-medium",
  colors.text.primary,
  "aria-selected:bg-white/[0.07]",
  `aria-selected:${colors.text.primary}`,
].join(" ");

function GroupIcon({ group }: { group: CommandGroupKey }) {
  const iconWrap =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.04]";
  const iconClass = colors.text.tertiary;

  switch (group) {
    case "navigation":
      return (
        <span className={iconWrap}>
          <Compass size={14} className={iconClass} strokeWidth={1.75} />
        </span>
      );
    case "view":
      return (
        <span className={iconWrap}>
          <LayoutGrid size={14} className={iconClass} strokeWidth={1.75} />
        </span>
      );
    case "canvas":
      return (
        <span className={iconWrap}>
          <Grid3x3 size={14} className={iconClass} strokeWidth={1.75} />
        </span>
      );
    case "tasks":
      return (
        <span className={iconWrap}>
          <CheckSquare size={14} className={iconClass} strokeWidth={1.75} />
        </span>
      );
    case "debug":
      return (
        <span className={iconWrap}>
          <Bug size={14} className={iconClass} strokeWidth={1.75} />
        </span>
      );
    default:
      return null;
  }
}

function CommandRow({ cmd }: { cmd: CommandDefinition }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <GroupIcon group={cmd.group} />
        <span className={`text-[13px] font-medium ${colors.text.primary}`}>
          {cmd.label}
        </span>
      </div>
      {cmd.shortcut ? (
        <kbd
          className={`shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] ${colors.text.tertiary}`}
        >
          {formatShortcutLabel(cmd.shortcut)}
        </kbd>
      ) : null}
    </>
  );
}

export function CommandPalette() {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const commandQuery = useUIStore((s) => s.commandQuery);
  const setCommandQuery = useUIStore((s) => s.setCommandQuery);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);

  const activeView = useUIStore((s) => s.activeView);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const activeLayer = useCanvasStore((s) => s.activeLayer);

  const graph = useOrgGraphData();
  const projects = graph.data?.projects ?? [];

  const allCommands = useCommandRegistry();

  const availableCommands = useMemo(() => {
    const isBlockedTaskSelected =
      selectedNodeType === "task" &&
      selectedNodeId !== null &&
      (() => {
        const node = nodes.find((n) => n.id === selectedNodeId);
        return (
          (node?.data as TaskCardNodeData | undefined)?.task.status === "blocked"
        );
      })();

    const contexts = resolveActiveContexts({
      activeView,
      selectedNodeType,
      activeLayer,
      isBlockedTaskSelected: Boolean(isBlockedTaskSelected),
    });

    return allCommands.filter((cmd) => isCommandAvailable(cmd, contexts));
  }, [
    allCommands,
    activeView,
    nodes,
    selectedNodeId,
    selectedNodeType,
    activeLayer,
  ]);

  const filteredCommands = useMemo(
    () => filterCommandsByQuery(availableCommands, commandQuery),
    [availableCommands, commandQuery],
  );

  const groupedCommands = useMemo(() => {
    const groups = new Map<CommandGroupKey, CommandDefinition[]>();
    for (const key of GROUP_ORDER) {
      groups.set(key, []);
    }
    for (const cmd of filteredCommands) {
      const list = groups.get(cmd.group) ?? [];
      list.push(cmd);
      groups.set(cmd.group, list);
    }
    return groups;
  }, [filteredCommands]);

  const filteredProjects = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    return projects.filter(
      (p) => !q || p.name.toLowerCase().includes(q),
    );
  }, [projects, commandQuery]);

  const handleSelect = useCallback(
    (commandId: string) => {
      const command = allCommands.find((c) => c.id === commandId);
      if (!command) return;
      command.perform();
      setCommandQuery("");
      closeCommandPalette();
    },
    [allCommands, setCommandQuery, closeCommandPalette],
  );

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      closeCommandPalette();
      setCommandQuery("");
      void import("@/lib/canvas/reactFlowApi").then(({ focusCanvasNode }) => {
        useUIStore.getState().setActiveView("canvas");
        setTimeout(() => focusCanvasNode(`project-${projectId}`), 80);
      });
    },
    [closeCommandPalette, setCommandQuery],
  );

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <motion.div
          key="command-palette-backdrop"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-[18vh] backdrop-blur-[2px]"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={closeCommandPalette}
        >
          <motion.div
            key="command-palette-modal"
            className={`flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border ${colors.bg.elevated} ${colors.border.default} ${shadows.elevated}`}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              label="Command palette"
              shouldFilter={false}
              className="flex flex-col"
            >
              <div
                className={`flex items-center gap-2 border-b px-4 ${colors.border.subtle}`}
              >
                <Search
                  size={15}
                  className={`shrink-0 ${colors.text.tertiary}`}
                  strokeWidth={1.75}
                />
                <Command.Input
                  value={commandQuery}
                  onValueChange={setCommandQuery}
                  placeholder="Search commands, tasks, people…"
                  className={`flex-1 border-0 bg-transparent py-3 text-[14px] outline-none ${colors.text.primary} placeholder:${colors.text.tertiary}`}
                  autoFocus
                />
                {commandQuery ? (
                  <button
                    type="button"
                    onClick={() => setCommandQuery("")}
                    className={`shrink-0 p-1 ${colors.text.tertiary} hover:${colors.text.secondary}`}
                    aria-label="Clear search"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>

              <Command.List className="hide-scrollbar max-h-[min(360px,45vh)] overflow-y-auto px-2 py-2">
                <Command.Empty
                  className={`flex flex-col items-center gap-2 py-10 text-[13px] ${colors.text.tertiary}`}
                >
                  <Search size={20} className={colors.text.disabled} />
                  <span>No results for &quot;{commandQuery}&quot;</span>
                </Command.Empty>
                {GROUP_ORDER.map((groupKey) => {
                  const items = groupedCommands.get(groupKey) ?? [];
                  if (items.length === 0) return null;
                  return (
                    <Command.Group
                      key={groupKey}
                      heading={COMMAND_GROUP_LABELS[groupKey]}
                      className={`mb-1 ${groupHeadingClass}`}
                    >
                      {items.map((cmd) => (
                        <Command.Item
                          key={cmd.id}
                          value={cmd.id}
                          onSelect={() => handleSelect(cmd.id)}
                          className={itemClass}
                        >
                          <CommandRow cmd={cmd} />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
                {graph.isError ? (
                  <Command.Group heading="PROJECTS" className={groupHeadingClass}>
                    <Command.Item
                      value="projects-org-error"
                      disabled
                      className={`${itemClass} opacity-60 cursor-not-allowed`}
                    >
                      <span className={`text-[13px] ${colors.text.tertiary}`}>
                        ⚠ Org not loaded — check console
                      </span>
                    </Command.Item>
                  </Command.Group>
                ) : filteredProjects.length > 0 ? (
                  <Command.Group heading="PROJECTS" className={groupHeadingClass}>
                    {filteredProjects.map((project) => (
                      <Command.Item
                        key={project.id}
                        value={`project-${project.id}`}
                        onSelect={() => handleProjectSelect(project.id)}
                        className={itemClass}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                            <span
                              className={`h-2 w-2 rounded-full ${PROJECT_COLOR_MAP[project.color] ?? PROJECT_COLOR_MAP.coral}`}
                            />
                          </span>
                          <span
                            className={`text-[13px] font-medium ${colors.text.primary}`}
                          >
                            {project.name}
                          </span>
                          <span
                            className={`ml-auto text-[11px] ${colors.text.tertiary}`}
                          >
                            Go to canvas
                          </span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </Command.List>

              <div
                className={`flex items-center justify-between border-t bg-white/[0.02] px-4 py-2.5 ${colors.border.subtle}`}
              >
                <span
                  className={`text-[10px] tracking-wide ${colors.text.disabled}`}
                >
                  ↑ ↓ navigate &nbsp;&nbsp; ↵ select &nbsp;&nbsp; esc close
                </span>
                <kbd
                  className={`rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] ${colors.text.tertiary}`}
                >
                  ⌘K
                </kbd>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
