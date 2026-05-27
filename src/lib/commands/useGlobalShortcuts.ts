"use client";

import { useEffect, useRef } from "react";
import { useCommandRegistry } from "@/lib/commands/useCommandRegistry";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import type { TaskCardNodeData } from "@/types";
import {
  isCommandAvailable,
  isSequenceShortcut,
  isTypingTarget,
  matchKeyboardShortcut,
  resolveActiveContexts,
} from "@/lib/commands/commandUtils";
import type { CommandDefinition } from "@/types/commands";

const SEQUENCE_TIMEOUT_MS = 800;

const SEQUENCE_MAP: Record<string, string> = {
  c: "open-canvas-view",
  d: "open-dashboard-view",
  g: "open-gantt-view",
};

export function useGlobalShortcuts() {
  const commands = useCommandRegistry();
  const sequenceRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const runCommand = (id: string) => {
      const state = {
        activeView: useUIStore.getState().activeView,
        selectedNodeType: useCanvasStore.getState().selectedNodeType,
        activeLayer: useCanvasStore.getState().activeLayer,
        isBlockedTaskSelected: false,
      };
      const { selectedNodeId, selectedNodeType, nodes } =
        useCanvasStore.getState();
      if (selectedNodeType === "task" && selectedNodeId) {
        const node = nodes.find((n) => n.id === selectedNodeId);
        const task = node
          ? (node.data as TaskCardNodeData).task
          : undefined;
        state.isBlockedTaskSelected = task?.status === "blocked";
      }

      const activeContexts = resolveActiveContexts(state);
      const command = commands.find((c) => c.id === id);
      if (!command || !isCommandAvailable(command, activeContexts)) return;
      command.perform();
    };

    const handleEscapeChain = () => {
      const ui = useUIStore.getState();
      const canvas = useCanvasStore.getState();

      if (ui.showKeyboardHelp) {
        ui.toggleKeyboardHelp(false);
        return;
      }

      if (ui.isCommandPaletteOpen) {
        ui.closeCommandPalette();
        ui.setCommandQuery("");
        return;
      }

      if (canvas.cascadeImpact) {
        canvas.dismissCascade();
        return;
      }

      if (ui.isRightPanelOpen) {
        ui.closeRightPanel();
        canvas.selectNode(null, null);
        return;
      }

      if (canvas.selectedNodeId) {
        canvas.selectNode(null, null);
      }
    };

    const tryRunShortcut = (
      event: KeyboardEvent,
      command: CommandDefinition,
    ): boolean => {
      if (!command.shortcut || isSequenceShortcut(command.shortcut)) {
        return false;
      }
      if (!matchKeyboardShortcut(event, command.shortcut)) return false;

      const state = {
        activeView: useUIStore.getState().activeView,
        selectedNodeType: useCanvasStore.getState().selectedNodeType,
        activeLayer: useCanvasStore.getState().activeLayer,
        isBlockedTaskSelected: false,
      };
      const { selectedNodeId, selectedNodeType, nodes } =
        useCanvasStore.getState();
      if (selectedNodeType === "task" && selectedNodeId) {
        const node = nodes.find((n) => n.id === selectedNodeId);
        const task = node
          ? (node.data as TaskCardNodeData).task
          : undefined;
        state.isBlockedTaskSelected = task?.status === "blocked";
      }

      const activeContexts = resolveActiveContexts(state);
      if (!isCommandAvailable(command, activeContexts)) return false;

      event.preventDefault();
      command.perform();
      return true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleEscapeChain();
        return;
      }

      const typing = isTypingTarget(event.target);

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        runCommand("toggle-command-palette");
        return;
      }

      if (typing) return;

      if (
        event.key === "?" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        useUIStore.getState().toggleKeyboardHelp();
        return;
      }

      const now = Date.now();
      const lower = event.key.toLowerCase();

      if (
        sequenceRef.current &&
        now - sequenceRef.current.at < SEQUENCE_TIMEOUT_MS
      ) {
        if (sequenceRef.current.key === "g") {
          const commandId = SEQUENCE_MAP[lower];
          if (commandId) {
            event.preventDefault();
            runCommand(commandId);
            sequenceRef.current = null;
            return;
          }
        }
        sequenceRef.current = null;
      }

      if (
        lower === "g" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        sequenceRef.current = { key: "g", at: now };
        return;
      }

      for (const command of commands) {
        if (tryRunShortcut(event, command)) return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commands]);
}
