"use client";

import React, { useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";
import { useCommandRegistry } from "@/lib/commands/useCommandRegistry";
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 pt-[10vh]"
      role="presentation"
      onClick={closeCommandPalette}
    >
      <div
        className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-container-highest shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/[0.08] px-4">
            <Search
              size={16}
              className="shrink-0 text-on-surface-variant"
              strokeWidth={1.75}
            />
            <Command.Input
              value={commandQuery}
              onValueChange={setCommandQuery}
              placeholder="Search commands…"
              className="text-body-md flex-1 border-0 bg-transparent py-3.5 text-on-surface outline-none placeholder:text-on-surface-variant"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[min(400px,50vh)] overflow-y-auto px-2 py-2">
            <Command.Empty className="text-body-sm px-3 py-8 text-center text-on-surface-variant">
              No commands found
            </Command.Empty>
            {GROUP_ORDER.map((groupKey) => {
              const items = groupedCommands.get(groupKey) ?? [];
              if (items.length === 0) return null;
              return (
                <Command.Group
                  key={groupKey}
                  heading={COMMAND_GROUP_LABELS[groupKey]}
                  className="mb-1 [&_[cmdk-group-heading]]:text-section-header [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-on-surface-variant"
                >
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => handleSelect(cmd.id)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-on-surface aria-selected:bg-primary/10"
                    >
                      <span className="text-body-sm font-medium">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="font-mono-label ml-4 shrink-0 rounded-md border border-white/10 bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">
                          {formatShortcutLabel(cmd.shortcut)}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
            <span className="font-mono-label text-[10px] text-outline">
              ↑↓ navigate · ↵ select · esc close
            </span>
            <span className="font-mono-label rounded-md border border-white/10 bg-surface-container-low px-1.5 py-0.5 text-[10px] text-on-surface-variant">
              ⌘K
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
