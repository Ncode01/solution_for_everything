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

export async function focusCanvasNode(nodeId: string): Promise<void> {
  if (!instance) return;
  const node = instance.getNode(nodeId);
  if (!node) return;

  const width =
    typeof node.width === "number"
      ? node.width
      : typeof node.measured?.width === "number"
        ? node.measured.width
        : 220;
  const height =
    typeof node.height === "number"
      ? node.height
      : typeof node.measured?.height === "number"
        ? node.measured.height
        : 80;

  await instance.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
    zoom: 1.15,
    duration: 400,
  });
  useCanvasStore.getState().setViewport(instance.getViewport());
}
