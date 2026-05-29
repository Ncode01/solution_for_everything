"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { setReactFlowInstance } from "@/lib/canvas/reactFlowApi";

export function ReactFlowApiBridge() {
  const flow = useReactFlow();
  const flowRef = useRef(flow);
  flowRef.current = flow;

  // Set synchronously on first render so focusCanvasNode calls
  // that happen within the same tick don't get a null instance.
  // (Idempotent — same flow object reference on re-renders.)
  setReactFlowInstance(flow);

  useEffect(() => {
    setReactFlowInstance(flow);
    return () => setReactFlowInstance(null);
  }, [flow]);

  return null;
}
