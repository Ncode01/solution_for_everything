"use client";

import type { Node, NodeProps } from "@xyflow/react";
import type { ProjectEnvelopeNodeData } from "@/types";
import { ProjectEnvelopeNode } from "@/components/canvas/nodes/ProjectEnvelopeNode";

export type GroupNodeData = ProjectEnvelopeNodeData;
type GroupFlowNode = Node<GroupNodeData, "projectEnvelope">;

export default function GroupNode(props: NodeProps<GroupFlowNode>) {
  return <ProjectEnvelopeNode {...(props as unknown as NodeProps)} />;
}
