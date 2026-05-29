import type { ReactFlowInstance } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";

let instance: ReactFlowInstance | null = null;

export function setReactFlowInstance(flow: ReactFlowInstance | null): void {
  instance = flow;
}

export function getReactFlowInstance(): ReactFlowInstance | null {
  return instance;
}

export async function fitCanvasView(): Promise<void> {
  if (!instance) return;
  await instance.fitView({ padding: 0.18, duration: 320 });
  useCanvasStore.getState().setViewport(instance.getViewport());
}

export async function applyCanvasViewport(viewport: {
  x: number;
  y: number;
  zoom: number;
}): Promise<void> {
  if (!instance) return;
  await instance.setViewport(viewport, { duration: 0 });
  useCanvasStore.getState().setViewport(viewport);
}

export async function focusCanvasNode(
  nodeId: string,
  options?: { zoom?: number; duration?: number },
): Promise<void> {
  if (!instance) return;

  await instance.fitView({
    nodes: [{ id: nodeId }],
    padding: 0.35,
    duration: options?.duration ?? 420,
    minZoom: options?.zoom ?? 0.8,
    maxZoom: options?.zoom ?? 1.4,
  });
  useCanvasStore.getState().setViewport(instance.getViewport());
}

export async function focusCanvasPoint(
  x: number,
  y: number,
  zoom = 1.2,
  duration = 400,
): Promise<void> {
  if (!instance) return;
  await instance.setCenter(x, y, { zoom, duration });
  useCanvasStore.getState().setViewport(instance.getViewport());
}
