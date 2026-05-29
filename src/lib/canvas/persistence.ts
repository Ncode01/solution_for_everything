import type { Node, Viewport } from "@xyflow/react";

type SavedNodePositions = Record<string, { x: number; y: number }>;

const canUseStorage = () => typeof window !== "undefined";

function parseNodePositions(raw: string | null): SavedNodePositions {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SavedNodePositions;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function canvasPositionsStorageKey(boardId: string): string {
  return `canvas_positions_${boardId}`;
}

export function canvasViewportStorageKey(boardId: string): string {
  return `canvas_viewport_${boardId}`;
}

export function loadCanvasNodePositions(boardId: string): SavedNodePositions {
  if (!canUseStorage()) return {};
  return parseNodePositions(localStorage.getItem(canvasPositionsStorageKey(boardId)));
}

export function persistCanvasNodePositions(boardId: string, nodes: Node[]): void {
  if (!canUseStorage()) return;
  const positions: SavedNodePositions = {};
  for (const node of nodes) {
    positions[node.id] = {
      x: Number(node.position.x) || 0,
      y: Number(node.position.y) || 0,
    };
  }
  localStorage.setItem(canvasPositionsStorageKey(boardId), JSON.stringify(positions));
}

export function applyStoredNodePositions(boardId: string, nodes: Node[]): Node[] {
  const savedPositions = loadCanvasNodePositions(boardId);
  if (!Object.keys(savedPositions).length) return nodes;

  return nodes.map((node) => {
    const saved = savedPositions[node.id];
    if (!saved) return node;
    return {
      ...node,
      position: { x: saved.x, y: saved.y },
    };
  });
}

export function loadCanvasViewport(boardId: string): Viewport | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(canvasViewportStorageKey(boardId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Viewport;
    if (
      typeof parsed?.x !== "number" ||
      typeof parsed?.y !== "number" ||
      typeof parsed?.zoom !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistCanvasViewport(boardId: string, viewport: Viewport): void {
  if (!canUseStorage()) return;
  localStorage.setItem(canvasViewportStorageKey(boardId), JSON.stringify(viewport));
}
