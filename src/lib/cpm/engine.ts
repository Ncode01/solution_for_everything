import type { CPMTask, CPMNode, CascadeImpact, CPMResult } from "./types";

function topologicalSort(tasks: CPMTask[]): string[] {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const task of tasks) {
    inDegree[task.id] = task.dependencies.length;
    adj[task.id] = [...task.dependents];
  }

  const queue: string[] = tasks
    .filter((t) => t.dependencies.length === 0)
    .map((t) => t.id);

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const next of adj[current] ?? []) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  if (sorted.length !== tasks.length) {
    console.warn(
      "[CPM] Cycle detected in dependency graph — skipping cyclic nodes",
    );
  }

  return sorted;
}

function forwardPass(
  sorted: string[],
  tasks: Map<string, CPMTask>,
  nodes: Record<string, CPMNode>,
): void {
  for (const id of sorted) {
    const task = tasks.get(id)!;
    const node = nodes[id];

    if (task.dependencies.length === 0) {
      node.earlyStart = 0;
    } else {
      node.earlyStart = Math.max(
        ...task.dependencies.map((depId) => nodes[depId]?.earlyFinish ?? 0),
      );
    }
    node.earlyFinish = node.earlyStart + node.duration;
  }
}

function backwardPass(
  sorted: string[],
  tasks: Map<string, CPMTask>,
  nodes: Record<string, CPMNode>,
  projectDuration: number,
): void {
  for (const id of [...sorted].reverse()) {
    const task = tasks.get(id)!;
    const node = nodes[id];

    if (task.dependents.length === 0) {
      node.lateFinish = projectDuration;
    } else {
      node.lateFinish = Math.min(
        ...task.dependents.map(
          (depId) => nodes[depId]?.lateStart ?? projectDuration,
        ),
      );
    }
    node.lateStart = node.lateFinish - node.duration;
    node.float = node.lateStart - node.earlyStart;
    node.isCriticalPath = node.float === 0;
  }
}

function getAllDownstream(
  taskId: string,
  tasks: Map<string, CPMTask>,
): string[] {
  const visited = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const task = tasks.get(current);
    if (!task) continue;

    for (const dep of task.dependents) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }

  return Array.from(visited);
}

export function computeCPM(cpmTasks: CPMTask[]): CPMResult {
  const taskMap = new Map(cpmTasks.map((t) => [t.id, t]));

  const nodes: Record<string, CPMNode> = {};
  for (const task of cpmTasks) {
    nodes[task.id] = {
      id: task.id,
      duration: task.duration,
      dependencies: [...task.dependencies],
      dependents: [...task.dependents],
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0,
      float: 0,
      isCriticalPath: false,
    };
  }

  const sorted = topologicalSort(cpmTasks);
  forwardPass(sorted, taskMap, nodes);

  const projectDuration = Math.max(
    ...Object.values(nodes).map((n) => n.earlyFinish),
    0,
  );

  backwardPass(sorted, taskMap, nodes, projectDuration);

  const criticalPath = sorted.filter((id) => nodes[id]?.isCriticalPath);

  return { nodes, criticalPath, projectDuration };
}

export function computeCascadeImpact(
  blockedTaskId: string,
  cpmTasks: CPMTask[],
  cpmResult: CPMResult,
): CascadeImpact {
  const taskMap = new Map(cpmTasks.map((t) => [t.id, t]));
  const blockedTask = taskMap.get(blockedTaskId);
  if (!blockedTask) {
    return {
      sourceTaskId: blockedTaskId,
      directlyBlockedIds: [],
      transitivelyBlockedIds: [],
      estimatedDelayDays: 0,
      criticalPathImpacted: false,
      cascadeChain: [],
    };
  }

  const directlyBlocked = blockedTask.dependents;
  const transitivelyBlocked = getAllDownstream(blockedTaskId, taskMap);

  const blockedNode = cpmResult.nodes[blockedTaskId];
  const estimatedDelay = Math.ceil((blockedNode?.duration ?? 0) / 8);

  const criticalPathImpacted = transitivelyBlocked.some(
    (id) => cpmResult.nodes[id]?.isCriticalPath,
  );

  const cascadeChain = [...transitivelyBlocked].sort((a, b) => {
    const aStart = cpmResult.nodes[a]?.earlyStart ?? 0;
    const bStart = cpmResult.nodes[b]?.earlyStart ?? 0;
    return aStart - bStart;
  });

  return {
    sourceTaskId: blockedTaskId,
    directlyBlockedIds: directlyBlocked,
    transitivelyBlockedIds: transitivelyBlocked,
    estimatedDelayDays: estimatedDelay,
    criticalPathImpacted,
    cascadeChain,
  };
}
