export function wouldIntroduceCycle(
  allDeps: Array<{ upstreamTaskId: string; downstreamTaskId: string }>,
  proposedUpstream: string,
  targetTask: string,
): boolean {
  const adjacency: Record<string, string[]> = {};
  for (const dep of allDeps) {
    if (!adjacency[dep.upstreamTaskId]) adjacency[dep.upstreamTaskId] = [];
    adjacency[dep.upstreamTaskId].push(dep.downstreamTaskId);
  }

  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (node === proposedUpstream) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    for (const next of adjacency[node] ?? []) {
      if (dfs(next)) return true;
    }
    return false;
  }

  return dfs(targetTask);
}
