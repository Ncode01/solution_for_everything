// ─────────────────────────────────────────────────────────────────
// GRID CONSTANTS
// ─────────────────────────────────────────────────────────────────

export const LAYOUT = {
  // Z0 — project cluster hex-offset grid
  PROJECT: {
    COLS: 3,
    COL_WIDTH: 960,
    ROW_HEIGHT: 1200,
    ORIGIN_X: 120,
    ORIGIN_Y: 200,
    HEX_OFFSET: 220,
  },

  // Milestones: stacked vertically to the RIGHT of their project cluster
  MILESTONE: {
    OFFSET_X: 260,
    OFFSET_Y: 50,
    ROW_HEIGHT: 90,
  },

  // Z1 — phase fan-out from project cluster
  PHASE: {
    OFFSET_X: 300,
    OFFSET_Y: 0,
    COL_WIDTH: 260,
    ROW_HEIGHT: 100,
    COLS: 1,
  },

  // Z2/Z3 — task swimlane within a project band
  TASK: {
    BAND_OFFSET_Y: 250,
    PHASE_COL_WIDTH: 250,
    PHASE_GAP: 60,
    TASK_ROW_HEIGHT: 130,
    TASKS_PER_COL: 5,
    CRITICAL_NUDGE_Y: -18,
    SLACK_NUDGE_Y: 18,
  },

  // Person nodes: hidden row far above the grid, positioned on expand
  PERSON: {
    ROW_Y: -300,
    COL_WIDTH: 110,
    ORIGIN_X: 120,
  },
} as const;

export function projectGridPosition(
  index: number,
  savedX?: number | null,
  savedY?: number | null,
): { x: number; y: number } {
  if (savedX != null && savedY != null && (savedX !== 0 || savedY !== 0)) {
    return { x: savedX, y: savedY };
  }
  const col = index % LAYOUT.PROJECT.COLS;
  const row = Math.floor(index / LAYOUT.PROJECT.COLS);
  const hexShift = col % 2 === 1 ? LAYOUT.PROJECT.HEX_OFFSET : 0;
  return {
    x: LAYOUT.PROJECT.ORIGIN_X + col * LAYOUT.PROJECT.COL_WIDTH,
    y: LAYOUT.PROJECT.ORIGIN_Y + row * LAYOUT.PROJECT.ROW_HEIGHT + hexShift,
  };
}

export function milestonePosition(
  projectPos: { x: number; y: number },
  milestoneIndexInProject: number,
  savedX?: number | null,
  savedY?: number | null,
): { x: number; y: number } {
  if (savedX != null && savedY != null && (savedX !== 0 || savedY !== 0)) {
    return { x: savedX, y: savedY };
  }
  return {
    x: projectPos.x + LAYOUT.MILESTONE.OFFSET_X,
    y:
      projectPos.y +
      LAYOUT.MILESTONE.OFFSET_Y +
      milestoneIndexInProject * LAYOUT.MILESTONE.ROW_HEIGHT,
  };
}

export function phasePosition(
  projectPos: { x: number; y: number },
  phaseIndex: number,
): { x: number; y: number } {
  return {
    x: projectPos.x + LAYOUT.PHASE.OFFSET_X,
    y: projectPos.y + LAYOUT.PHASE.OFFSET_Y + phaseIndex * LAYOUT.PHASE.ROW_HEIGHT,
  };
}

export function taskSwimlanePosition(
  projectPos: { x: number; y: number },
  phaseIndex: number,
  taskIndexInPhase: number,
  isCriticalPath: boolean,
  slackTime: number,
  savedX: number,
  savedY: number,
): { x: number; y: number } {
  if (savedX !== 0 || savedY !== 0) {
    return { x: savedX, y: savedY };
  }

  const subCol = Math.floor(taskIndexInPhase / LAYOUT.TASK.TASKS_PER_COL);
  const rowInSubCol = taskIndexInPhase % LAYOUT.TASK.TASKS_PER_COL;

  const phaseColX =
    projectPos.x +
    phaseIndex * (LAYOUT.TASK.PHASE_COL_WIDTH + LAYOUT.TASK.PHASE_GAP) +
    subCol * LAYOUT.TASK.PHASE_COL_WIDTH;

  const baseY =
    projectPos.y +
    LAYOUT.TASK.BAND_OFFSET_Y +
    rowInSubCol * LAYOUT.TASK.TASK_ROW_HEIGHT;

  let nudgeY = 0;
  if (isCriticalPath) {
    nudgeY = LAYOUT.TASK.CRITICAL_NUDGE_Y;
  } else if (slackTime >= 3) {
    nudgeY = LAYOUT.TASK.SLACK_NUDGE_Y;
  }

  return { x: phaseColX, y: baseY + nudgeY };
}

export function personRowPosition(userIndex: number): { x: number; y: number } {
  return {
    x: LAYOUT.PERSON.ORIGIN_X + userIndex * LAYOUT.PERSON.COL_WIDTH,
    y: LAYOUT.PERSON.ROW_Y,
  };
}

export function personArcPosition(
  projectPos: { x: number; y: number },
  memberIndex: number,
  totalMembers: number,
): { x: number; y: number } {
  const spacing = 80;
  const totalWidth = (totalMembers - 1) * spacing;
  return {
    x: projectPos.x + 10 + memberIndex * spacing - totalWidth / 2,
    y: projectPos.y - 170,
  };
}

export type LayoutConstants = typeof LAYOUT;

export const ENVELOPE_HEADER_HEIGHT = 32;
export const ENVELOPE_PADDING_X = 60;
export const ENVELOPE_BODY_TOP_OFFSET = 20;

/**
 * Computes the pixel size of a project envelope box.
 *
 * The envelope must contain:
 *   - The ProjectClusterNode (at projectPos, 210px wide, 110px tall)
 *   - All phase header nodes (at BAND_OFFSET_Y - 50px above task rows)
 *   - All task swimlane columns (taskCount tasks across phaseCount phases)
 *
 * Returns the width and height of the envelope, with padding.
 */
export function envelopeSize(
  phaseCount: number,
  maxTasksInAnyPhase: number,
): { width: number; height: number } {
  const PADDING_X = ENVELOPE_PADDING_X;
  const PADDING_Y = 80;
  const HEADER_H = ENVELOPE_HEADER_HEIGHT;

  const taskAreaWidth =
    phaseCount * (LAYOUT.TASK.PHASE_COL_WIDTH + LAYOUT.TASK.PHASE_GAP);

  const subCols = Math.ceil(maxTasksInAnyPhase / LAYOUT.TASK.TASKS_PER_COL);
  const phaseWidth = subCols * LAYOUT.TASK.PHASE_COL_WIDTH;
  const totalTaskWidth = phaseCount * (phaseWidth + LAYOUT.TASK.PHASE_GAP);

  const width =
    Math.max(taskAreaWidth, totalTaskWidth, 300) + PADDING_X * 2;

  const taskRows = Math.min(maxTasksInAnyPhase, LAYOUT.TASK.TASKS_PER_COL);
  const taskAreaHeight =
    LAYOUT.TASK.BAND_OFFSET_Y + taskRows * LAYOUT.TASK.TASK_ROW_HEIGHT;

  const height = HEADER_H + taskAreaHeight + PADDING_Y * 2;

  return { width, height };
}

export const RICH_LAYOUT = {
  COL_WIDTH: 300,
  WIDGET_COL_WIDTH: 320,
  START_Y_OFFSET: 250,
  VERTICAL_GAP: 18,
  PHASE_LABEL_H: 44,
  PHASE_LABEL_GAP: 16,
} as const;

/**
 * Computes the x offset from projectPos.x for a given column index.
 * Columns 0–2 are task phases (width=300 each).
 * Columns 3–6 are widget areas (width=320 each).
 */
export function richColumnX(
  projectPosX: number,
  columnIndex: number,
): number {
  const TASK_COLS = 3;
  const TASK_COL_W = RICH_LAYOUT.COL_WIDTH;
  const WIDGET_COL_W = RICH_LAYOUT.WIDGET_COL_WIDTH;
  if (columnIndex < TASK_COLS) {
    return projectPosX + columnIndex * TASK_COL_W;
  }
  return (
    projectPosX +
    TASK_COLS * TASK_COL_W +
    (columnIndex - TASK_COLS) * WIDGET_COL_W
  );
}

/**
 * Computes cumulative y positions for nodes stacked in a column.
 */
export function stackedColumnPositions(
  projectPosY: number,
  nodeHeights: number[],
  startYOffset: number = RICH_LAYOUT.START_Y_OFFSET,
  gap: number = RICH_LAYOUT.VERTICAL_GAP,
): number[] {
  const positions: number[] = [];
  let cursor = projectPosY + startYOffset;
  for (const h of nodeHeights) {
    positions.push(cursor);
    cursor += h + gap;
  }
  return positions;
}

/** Total height consumed by a column of stacked nodes. */
export function columnHeight(
  nodeHeights: number[],
  gap = RICH_LAYOUT.VERTICAL_GAP,
): number {
  if (nodeHeights.length === 0) return 0;
  return nodeHeights.reduce((s, h) => s + h + gap, 0) - gap;
}

/** Envelope size for rich column layout (3 task + up to 4 widget columns). */
export function richEnvelopeSize(
  columnCount: number,
  maxColumnHeight: number,
): { width: number; height: number } {
  const TASK_COLS = Math.min(columnCount, 3);
  const WIDGET_COLS = Math.max(columnCount - 3, 0);
  const width =
    TASK_COLS * RICH_LAYOUT.COL_WIDTH +
    WIDGET_COLS * RICH_LAYOUT.WIDGET_COL_WIDTH +
    ENVELOPE_PADDING_X * 2 +
    40;

  const height =
    ENVELOPE_HEADER_HEIGHT +
    RICH_LAYOUT.START_Y_OFFSET +
    maxColumnHeight +
    80;

  return { width: Math.max(width, 400), height: Math.max(height, 300) };
}
