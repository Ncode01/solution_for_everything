export type CommandGroupKey =
  | "navigation"
  | "canvas"
  | "view"
  | "tasks"
  | "debug";

export type CommandContext =
  | "global"
  | "canvas"
  | "task-selected"
  | "blocked-task-selected"
  | "workload-active";

export interface CommandDefinition {
  id: string;
  label: string;
  keywords: string[];
  group: CommandGroupKey;
  shortcut?: string[];
  contexts: CommandContext[];
  perform: () => void;
  isVisible?: () => boolean;
  isDisabled?: () => boolean;
}

export const COMMAND_GROUP_LABELS: Record<CommandGroupKey, string> = {
  navigation: "Navigation",
  canvas: "Canvas",
  view: "View",
  tasks: "Tasks",
  debug: "Debug",
};
