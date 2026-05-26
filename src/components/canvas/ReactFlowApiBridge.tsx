"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { setReactFlowInstance } from "@/lib/canvas/reactFlowApi";

export function ReactFlowApiBridge() {
  const flow = useReactFlow();

  useEffect(() => {
    setReactFlowInstance(flow);
    return () => setReactFlowInstance(null);
  }, [flow]);

  return null;
}
