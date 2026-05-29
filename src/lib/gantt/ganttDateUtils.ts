/** ISO date string (YYYY-MM-DD) for a day index from the Gantt origin. */
export function dayIndexToIsoDate(originDate: Date, dayIndex: number): string {
  const d = new Date(originDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.round(dayIndex));
  return d.toISOString().slice(0, 10);
}

export function formatGanttRange(
  originDate: Date,
  startDay: number,
  durationDays: number,
): string {
  const endDay = startDay + durationDays - 1;
  const start = new Date(originDate);
  start.setDate(start.getDate() + Math.round(startDay));
  const end = new Date(originDate);
  end.setDate(end.getDate() + Math.round(endDay));
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function getTodayDayIndex(originDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const origin = new Date(originDate);
  origin.setHours(0, 0, 0, 0);
  return Math.round(
    (today.getTime() - origin.getTime()) / (1000 * 60 * 60 * 24),
  );
}
