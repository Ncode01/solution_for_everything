"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "./FlowCanvas";
import { RemoteCursors } from "./RemoteCursors";

export function CanvasWrapper() {
  return (
    <ReactFlowProvider>
      <RemoteCursors />
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
