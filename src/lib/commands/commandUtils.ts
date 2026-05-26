import type { CommandContext, CommandDefinition } from "@/types/commands";

const MODIFIER_KEYS = new Set(["Meta", "Ctrl", "Shift", "Alt"]);

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  return false;
}

export function resolveActiveContexts(input: {
  activeView: string;
  selectedNodeType: string | null;
  activeLayer: string;
  isBlockedTaskSelected: boolean;
}): Set<CommandContext> {
  const contexts = new Set<CommandContext>(["global"]);
  if (input.activeView === "canvas") contexts.add("canvas");
  if (input.selectedNodeType === "task") contexts.add("task-selected");
  if (input.isBlockedTaskSelected) contexts.add("blocked-task-selected");
  if (input.activeLayer === "workload") contexts.add("workload-active");
  return contexts;
}

export function isCommandAvailable(
  command: CommandDefinition,
  activeContexts: Set<CommandContext>,
): boolean {
  const hasContext = command.contexts.some((ctx) => activeContexts.has(ctx));
  if (!hasContext) return false;
  if (command.isVisible && !command.isVisible()) return false;
  if (command.isDisabled?.()) return false;
  return true;
}

export function isSequenceShortcut(shortcut?: string[]): boolean {
  return (
    shortcut?.length === 2 &&
    shortcut[0] === "G" &&
    ["C", "D", "G"].includes(shortcut[1])
  );
}

export function matchKeyboardShortcut(
  event: KeyboardEvent,
  shortcut: string[],
): boolean {
  if (isSequenceShortcut(shortcut)) return false;

  const keyPart = shortcut.find((k) => !MODIFIER_KEYS.has(k));
  if (!keyPart) return false;

  const needsMeta = shortcut.includes("Meta");
  const needsCtrl = shortcut.includes("Ctrl");
  const needsShift = shortcut.includes("Shift");
  const needsAlt = shortcut.includes("Alt");

  if (keyPart === "K" && (needsMeta || shortcut.includes("Meta"))) {
    if (!event.metaKey && !event.ctrlKey) return false;
    if (event.shiftKey || event.altKey) return false;
    return event.key.toLowerCase() === "k";
  }

  if (needsMeta && !event.metaKey) return false;
  if (needsCtrl && !event.ctrlKey) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;

  if (keyPart === "Escape") {
    return event.key === "Escape";
  }

  if (needsMeta || needsCtrl || needsAlt) {
    return event.key.toLowerCase() === keyPart.toLowerCase();
  }

  if (needsShift) {
    return event.key.toLowerCase() === keyPart.toLowerCase();
  }

  return (
    event.key.toLowerCase() === keyPart.toLowerCase() &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey
  );
}

export function formatShortcutLabel(shortcut?: string[]): string {
  if (!shortcut?.length) return "";
  if (isSequenceShortcut(shortcut)) {
    return `${shortcut[0]} ${shortcut[1]}`;
  }
  return shortcut
    .map((key) => {
      if (key === "Meta") return "⌘";
      if (key === "Ctrl") return "Ctrl";
      if (key === "Shift") return "⇧";
      if (key === "Alt") return "⌥";
      if (key === "Escape") return "Esc";
      return key;
    })
    .join(
      shortcut.some((k) => MODIFIER_KEYS.has(k)) && shortcut.length > 1
        ? ""
        : " ",
    );
}

export function filterCommandsByQuery(
  commands: CommandDefinition[],
  query: string,
): CommandDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((cmd) => {
    const haystack = [cmd.label, cmd.group, ...cmd.keywords]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
