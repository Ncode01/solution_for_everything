import { badgeVariants, priorityStripeClass, statusBadgeClass } from "@/design-system/components";
import type { PosterStatusKey, TaskPriorityKey, TaskStatusKey } from "@/design-system/tokens";

export { statusBadgeClass, priorityStripeClass } from "@/design-system/components";

export function posterBadgeClass(status: PosterStatusKey): string {
  return `${badgeVariants.poster[status]} rounded-full px-2 py-0.5 text-[11px] leading-[1.4] font-normal`;
}

export function taskStatusLabel(status: TaskStatusKey): string {
  const labels: Record<TaskStatusKey, string> = {
    notStarted: "Not Started",
    inProgress: "In Progress",
    blocked: "Blocked",
    inReview: "In Review",
    done: "Done",
  };
  return labels[status];
}

export function taskPriorityLabel(priority: TaskPriorityKey): string {
  const labels: Record<TaskPriorityKey, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority];
}
