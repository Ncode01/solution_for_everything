"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Zap } from "lucide-react";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatQueryError } from "@/lib/formatQueryError";
import { buildSparkTasksGraph } from "@/lib/spark/sparkTasksGraph";
import { SparkTaskNode } from "@/components/canvas/nodes/SparkTaskNode";
import { SparkPhaseHeaderNode } from "@/components/canvas/nodes/SparkPhaseHeaderNode";
import { SparkDependencyEdge } from "@/components/canvas/nodes/SparkDependencyEdge";
import { skeletonVariants } from "@/design-system/components";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { useCanvasStore } from "@/stores/canvas.store";

const nodeTypes = {
  sparkTask: SparkTaskNode,
  sparkPhaseHeader: SparkPhaseHeaderNode,
};

const edgeTypes = {
  sparkDependency: SparkDependencyEdge,
};

function SparkTasksFlow() {
  const graph = useOrgGraphData();
  const { fitView } = useReactFlow();
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);

  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [highlightCritical, setHighlightCritical] = useState(false);
  const [unlockPulseTaskIds, setUnlockPulseTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [completeGlowPhaseIds, setCompleteGlowPhaseIds] = useState<Set<string>>(
    () => new Set(),
  );

  const prevUpstreamPendingRef = useRef<Map<string, number>>(new Map());
  const prevPhaseDoneRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!graph.data) return;
    const sparkit = graph.data.projects.find((p) => p.name === "SparkIT'26");
    if (!sparkit) return;

    const sparkTasks = graph.data.tasks.filter((t) => t.projectId === sparkit.id);
    const taskById = new Map(sparkTasks.map((t) => [t.id, t]));
    const nextPending = new Map<string, number>();
    const newlyUnlocked: string[] = [];

    for (const task of sparkTasks) {
      const pending = task.dependencies.filter((depId) => {
        const up = taskById.get(depId);
        return up && up.status !== "done";
      }).length;
      nextPending.set(task.id, pending);
      const prev = prevUpstreamPendingRef.current.get(task.id);
      if (prev != null && prev > 0 && pending === 0) {
        newlyUnlocked.push(task.id);
      }
    }
    prevUpstreamPendingRef.current = nextPending;

    if (newlyUnlocked.length > 0) {
      setUnlockPulseTaskIds(new Set(newlyUnlocked));
      const timer = setTimeout(() => setUnlockPulseTaskIds(new Set()), 900);
      return () => clearTimeout(timer);
    }
  }, [graph.data]);

  useEffect(() => {
    if (!graph.data) return;
    const sparkit = graph.data.projects.find((p) => p.name === "SparkIT'26");
    if (!sparkit) return;

    const phases = graph.data.phases
      .filter((p) => p.projectId === sparkit.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const newlyComplete: string[] = [];
    for (const phase of phases) {
      const phaseTasks = graph.data.tasks.filter(
        (t) => t.projectId === sparkit.id && t.phaseId === phase.id,
      );
      const allDone =
        phaseTasks.length > 0 &&
        phaseTasks.every((t) => t.status === "done");
      const wasDone = prevPhaseDoneRef.current.get(phase.id) ?? false;
      if (allDone && !wasDone) {
        newlyComplete.push(phase.id);
      }
      prevPhaseDoneRef.current.set(phase.id, allDone);
    }

    if (newlyComplete.length > 0) {
      setCompleteGlowPhaseIds(new Set(newlyComplete));
      const timer = setTimeout(() => setCompleteGlowPhaseIds(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [graph.data]);

  const { nodes, edges, stats } = useMemo(() => {
    if (!graph.data) {
      return {
        nodes: [] as Node[],
        edges: [],
        stats: { total: 0, done: 0, inProgress: 0 },
      };
    }
    return buildSparkTasksGraph(graph.data, {
      hoveredTaskId,
      emphasizeCriticalPath: highlightCritical,
      unlockPulseTaskIds,
      completeGlowPhaseIds,
    });
  }, [
    graph.data,
    hoveredTaskId,
    highlightCritical,
    unlockPulseTaskIds,
    completeGlowPhaseIds,
  ]);

  const nodesWithSelection = useMemo(
    () =>
      nodes.map((n) => {
        if (!n.id.startsWith("spark-task-")) return n;
        const taskId = n.id.replace("spark-task-", "");
        return {
          ...n,
          selected: selectedNodeId === `task-${taskId}`,
          data: {
            ...n.data,
            isSelected: selectedNodeId === `task-${taskId}`,
          },
        };
      }),
    [nodes, selectedNodeId],
  );

  const runFitView = useCallback(() => {
    void fitView({ padding: 0.12, duration: 400 });
  }, [fitView]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(runFitView, 80);
    return () => clearTimeout(timer);
  }, [nodes.length, runFitView]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_e, node) => {
    if (node.id.startsWith("spark-task-")) {
      setHoveredTaskId(node.id.replace("spark-task-", ""));
    }
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoveredTaskId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    selectNode(null, null);
  }, [selectNode]);

  if (graph.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className={`h-48 w-full max-w-2xl ${skeletonVariants.base}`} />
      </div>
    );
  }

  if (graph.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(graph.error)}
        onRetry={() => graph.refetch()}
      />
    );
  }

  if (!graph.data?.projects.some((p) => p.name === "SparkIT'26")) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-body-sm text-on-surface-variant">
        SparkIT&apos;26 project not found in this org.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[rgba(18,17,28,0.85)] px-4 py-1.5 backdrop-blur-xl">
        <span className="pointer-events-auto flex items-center gap-2 text-[11px] font-medium text-[#F1F1F5]">
          <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
          SparkIT&apos;26
        </span>
        <span className="text-[rgba(255,255,255,0.2)]">|</span>
        <span className="text-[11px] text-[rgba(255,255,255,0.45)]">
          {stats.total} tasks · {stats.done} done · {stats.inProgress} in progress
        </span>
        <span className="text-[rgba(255,255,255,0.2)]">|</span>
        <button
          type="button"
          onClick={() => setHighlightCritical((v) => !v)}
          className={[
            "pointer-events-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
            highlightCritical
              ? "bg-[rgba(232,175,52,0.15)] text-[#E8AF34] shadow-[0_0_12px_rgba(232,175,52,0.25)]"
              : "text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]",
          ].join(" ")}
        >
          <Zap size={12} />
          Critical Path
        </button>
        <span className="text-[rgba(255,255,255,0.2)]">|</span>
        <button
          type="button"
          onClick={runFitView}
          className="pointer-events-auto rounded-full p-1 text-[rgba(255,255,255,0.5)] hover:bg-white/5 hover:text-white"
          aria-label="Fit view"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        minZoom={0.25}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="spark-tasks-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.03)"
          style={{ backgroundColor: "#0C0B14" }}
        />
      </ReactFlow>
    </div>
  );
}

export function TasksCanvasView() {
  return (
    <ReactFlowProvider>
      <SparkTasksFlow />
    </ReactFlowProvider>
  );
}
