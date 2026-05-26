import { computeCPM, computeCascadeImpact } from "./engine";
import type { CPMTask } from "./types";

const TEST_TASKS: CPMTask[] = [
  {
    id: "t1",
    duration: 8,
    dependencies: [],
    dependents: ["t2", "t3"],
    status: "done",
  },
  {
    id: "t2",
    duration: 12,
    dependencies: ["t1"],
    dependents: ["t5"],
    status: "in_progress",
  },
  {
    id: "t3",
    duration: 4,
    dependencies: ["t1"],
    dependents: ["t4"],
    status: "in_review",
  },
  {
    id: "t4",
    duration: 16,
    dependencies: ["t3"],
    dependents: ["t5"],
    status: "blocked",
  },
  {
    id: "t5",
    duration: 6,
    dependencies: ["t2", "t4"],
    dependents: [],
    status: "not_started",
  },
];

export function runCPMSmokeTest() {
  const result = computeCPM(TEST_TASKS);

  console.assert(result.criticalPath.includes("t1"), "t1 should be critical");
  console.assert(result.criticalPath.includes("t2"), "t2 should be critical");
  console.assert(result.criticalPath.includes("t5"), "t5 should be critical");
  console.assert(
    !result.criticalPath.includes("t3"),
    "t3 should NOT be critical",
  );

  const t3float = result.nodes["t3"]?.float;
  console.assert(
    typeof t3float === "number" && t3float > 0,
    "t3 should have positive float",
  );

  const cascade = computeCascadeImpact("t4", TEST_TASKS, result);
  console.assert(
    cascade.cascadeChain.includes("t5"),
    "blocking t4 should cascade to t5",
  );
  console.assert(
    cascade.criticalPathImpacted,
    "blocking t4 should impact critical path",
  );

  console.log("[CPM Smoke Test] PASSED");
  return result;
}
