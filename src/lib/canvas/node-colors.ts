import type { ProjectAccentColor } from "@/types";

export const ACCENT_HEX: Record<ProjectAccentColor, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

export const STATUS_COLORS: Record<string, string> = {
  not_started: "#4f4f4d",
  todo: "#4f4f4d",
  in_progress: "#5591C7",
  done: "#6DAA45",
  blocked: "#DD6974",
  in_review: "#E8AF34",
  review: "#E8AF34",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "#DD6974",
  high: "#E8AF34",
  medium: "#9C7EC7",
  low: "#4f4f4d",
};

export function accentHex(color: string): string {
  return ACCENT_HEX[color as ProjectAccentColor] ?? "#5591C7";
}
