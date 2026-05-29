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
