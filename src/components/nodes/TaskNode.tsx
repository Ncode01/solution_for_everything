"use client";

import type { Node, NodeProps } from "@xyflow/react";
import type { TaskCardNodeData } from "@/types";
import { TaskCardNode } from "@/components/canvas/nodes/TaskCardNode";

export type TaskNodeData = TaskCardNodeData;
type TaskFlowNode = Node<TaskNodeData, "taskCard">;

export default function TaskNode(props: NodeProps<TaskFlowNode>) {
  return <TaskCardNode {...(props as unknown as NodeProps)} />;
}
