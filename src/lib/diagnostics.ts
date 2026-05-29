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
