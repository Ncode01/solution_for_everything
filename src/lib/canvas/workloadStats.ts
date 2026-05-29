import type { Node } from "@xyflow/react";
import type { LoadLevel, PersonAvatarNodeData, TaskCardNodeData } from "@/types";

export interface WorkloadCounts {
  overloaded: number;
  atCapacity: number;
  overloadedTaskIds: Set<string>;
}

/** Derive workload stats from live canvas person + task nodes (API-backed). */
export function getWorkloadStatsFromNodes(nodes: Node[]): WorkloadCounts {
  const overloadedUserIds = new Set<string>();
  const atCapacityUserIds = new Set<string>();

  for (const node of nodes) {
    if (!node.id.startsWith("person-")) continue;
    const user = (node.data as PersonAvatarNodeData).user;
    if (user.loadLevel === "overloaded") {
      overloadedUserIds.add(user.id);
    } else if (user.loadLevel === "at_capacity") {
      atCapacityUserIds.add(user.id);
    }
  }

  const overloadedTaskIds = new Set<string>();
  for (const node of nodes) {
    if (!node.id.startsWith("task-")) continue;
    const task = (node.data as TaskCardNodeData).task;
    if (task.assigneeIds.some((id) => overloadedUserIds.has(id))) {
      overloadedTaskIds.add(task.id);
    }
  }

  return {
    overloaded: overloadedUserIds.size,
    atCapacity: atCapacityUserIds.size,
    overloadedTaskIds,
  };
}

export function countByLoadLevel(
  nodes: Node[],
  level: LoadLevel,
): number {
  let count = 0;
  for (const node of nodes) {
    if (!node.id.startsWith("person-")) continue;
    if ((node.data as PersonAvatarNodeData).user.loadLevel === level) {
      count += 1;
    }
  }
  return count;
}
