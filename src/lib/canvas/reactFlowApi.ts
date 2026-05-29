import type { ReactFlowInstance } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import type { ProjectEnvelopeNodeData } from "@/types";

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

/**
 * Focus the canvas camera on a specific node by ID.
 *
 * Strategy:
 *   1. Get the node from the ReactFlow instance.
 *   2. Use the node's position + measured dimensions to compute its
 *      true center in flow coordinates.
 *   3. Call setCenter() directly — this works even if the node was
 *      previously hidden or not yet measured, because we compute
 *      the center ourselves from position data.
 *   4. Never use fitView({nodes}) — that API silently no-ops on
 *      hidden nodes and fights itself when min/maxZoom are equal.
 */
export async function focusCanvasNode(
  nodeId: string,
  options?: { zoom?: number; duration?: number },
): Promise<void> {
  if (!instance) return;

  const node = instance.getNode(nodeId);
  if (!node) {
    // Node might not exist in the instance yet (e.g. person node still
    // hidden). Retry once after 150ms to let React commit.
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        const retryNode = instance?.getNode(nodeId);
        if (retryNode) {
          await focusCanvasNode(nodeId, options);
        }
        resolve();
      }, 150);
    });
    return;
  }

  // Prefer measured dimensions (post-render); fall back to sensible defaults
  // per node type so the camera always lands on something reasonable.
  if (node.type === "projectEnvelope") {
    const envData = node.data as ProjectEnvelopeNodeData;
    const w = envData.envelopeWidth ?? 300;
    const h = envData.envelopeHeight ?? 200;
    const cx = node.position.x + w / 2;
    const cy = node.position.y + h / 2;
    const targetZoom = options?.zoom ?? 1.1;
    const duration = options?.duration ?? 420;
    await instance.setCenter(cx, cy, { zoom: targetZoom, duration });
    useCanvasStore.getState().setViewport(instance.getViewport());
    return;
  }

  const typeDefaults: Record<string, { w: number; h: number }> = {
    projectCluster: { w: 210, h: 110 },
    taskCard: { w: 210, h: 80 },
    personAvatar: { w: 60, h: 80 },
    milestoneNode: { w: 180, h: 60 },
    phaseCluster: { w: 200, h: 70 },
    phaseHeader: { w: 200, h: 36 },
  };
  const defaults = typeDefaults[node.type ?? ""] ?? { w: 210, h: 80 };

  const w =
    typeof node.measured?.width === "number"
      ? node.measured.width
      : typeof node.width === "number"
        ? node.width
        : defaults.w;

  const h =
    typeof node.measured?.height === "number"
      ? node.measured.height
      : typeof node.height === "number"
        ? node.height
        : defaults.h;

  // Center of the node in flow coordinates
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;

  const targetZoom = options?.zoom ?? 1.1;
  const duration = options?.duration ?? 420;

  await instance.setCenter(cx, cy, { zoom: targetZoom, duration });
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
