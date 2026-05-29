import type { LoadLevel } from "@/types";

/** Heuristic load level from assigned task count (matches buildGraphFromApi). */
export function loadLevelFromTaskCount(taskCount: number): LoadLevel {
  const loadPercent = taskCount * 12.5;
  if (loadPercent > 100) return "overloaded";
  if (loadPercent > 70) return "at_capacity";
  return "available";
}

export const LOAD_LEVEL_DOT: Record<LoadLevel, string> = {
  available: "bg-[#6DAA45]",
  at_capacity: "bg-[#E8AF34]",
  overloaded: "bg-[#DD6974]",
};
