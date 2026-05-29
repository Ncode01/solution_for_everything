import type { ApiTask } from "@/lib/api/types";

export type DynamicTaskNodeType =
  | "taskCard"
  | "microTask"
  | "epicTask"
  | "blockedTask"
  | "criticalPathTask"
  | "reviewTask"
  | "recurringTask"
  | "checklistTask"
  | "costTask"
  | "ganttMiniBar"
  | "riskFlag"
  | "approvalGate"
  | "decisionDiamond"
  | "collabNote";

/**
 * Priority order (first matching rule wins):
 * 1. blocked            → blockedTask
 * 2. in_review          → reviewTask
 * 3. isDecisionPoint    → decisionDiamond
 * 4. requiresApproval   → approvalGate  (non-blocked)
 * 5. riskLevel set      → riskFlag
 * 6. isCriticalPath     → criticalPathTask
 * 7. ganttStartDate set → ganttMiniBar
 * 8. checklist len ≥ 1  → checklistTask
 * 9. note set           → collabNote
 * 10. recurrence set    → recurringTask
 * 11. costEstimate > 0  → costTask
 * 12. effortEstimate < 2 → microTask
 * 13. effort ≥ 16 or checklist ≥ 5 → epicTask
 * 14. everything else   → taskCard
 */
export function resolveTaskNodeType(
  task: ApiTask,
  isCriticalPath: boolean,
): DynamicTaskNodeType {
  if (task.status === "blocked") return "blockedTask";
  if (task.status === "in_review") return "reviewTask";
  if (task.isDecisionPoint) return "decisionDiamond";
  if (task.requiresApproval && !task.isDecisionPoint) return "approvalGate";
  if (task.riskLevel) return "riskFlag";
  if (isCriticalPath) return "criticalPathTask";
  if (task.ganttStartDate) return "ganttMiniBar";
  if (task.checklist && task.checklist.length >= 1) return "checklistTask";
  if (task.note) return "collabNote";
  if (task.recurrence) return "recurringTask";
  if ((task.costEstimate ?? 0) > 0) return "costTask";
  if ((task.effortEstimate ?? 0) < 2) return "microTask";
  if (
    (task.effortEstimate ?? 0) >= 16 ||
    (task.checklist?.length ?? 0) >= 5
  ) {
    return "epicTask";
  }
  return "taskCard";
}

/** Width in pixels for each node type — used for envelope size calc */
export const NODE_TYPE_WIDTH: Record<DynamicTaskNodeType, number> = {
  taskCard: 220,
  microTask: 160,
  epicTask: 240,
  blockedTask: 220,
  criticalPathTask: 220,
  reviewTask: 240,
  recurringTask: 220,
  checklistTask: 240,
  costTask: 220,
  ganttMiniBar: 280,
  riskFlag: 200,
  approvalGate: 180,
  decisionDiamond: 140,
  collabNote: 200,
};

/** Height in pixels (rendered) */
export const NODE_TYPE_HEIGHT: Record<DynamicTaskNodeType, number> = {
  taskCard: 95,
  microTask: 44,
  epicTask: 145,
  blockedTask: 105,
  criticalPathTask: 115,
  reviewTask: 150,
  recurringTask: 95,
  checklistTask: 155,
  costTask: 95,
  ganttMiniBar: 110,
  riskFlag: 110,
  approvalGate: 120,
  decisionDiamond: 120,
  collabNote: 110,
};

/** Gap between consecutive nodes in same column */
export const NODE_VERTICAL_GAP = 18;
