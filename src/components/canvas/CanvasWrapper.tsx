"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "./FlowCanvas";

export function CanvasWrapper() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
