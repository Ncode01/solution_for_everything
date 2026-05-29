/** Log a diagnostic message at most once per session (per key). */
const seen = new Set<string>();

export function logOnce(key: string, message: string): void {
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(message);
}

/** Dev-only once-per-session log. */
export function logDevOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === "production") return;
  logOnce(key, message);
}

/** Log when a user action is blocked (e.g. missing prerequisites). */
export function logDeadEndOnce(key: string, message: string): void {
  logOnce(`dead-end-${key}`, `[DeadEnd] ${message}`);
}
