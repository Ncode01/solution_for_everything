import type { CPMTask } from "./types";
import { computeCPM, computeCascadeImpact } from "./engine";

export { computeCPM, computeCascadeImpact } from "./engine";
export type { CPMTask, CPMNode, CascadeImpact, CPMResult } from "./types";

/** Task IDs on the critical path (zero float), in topological order. */
export function computeCriticalPath(cpmTasks: CPMTask[]): string[] {
  return computeCPM(cpmTasks).criticalPath;
}
