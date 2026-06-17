/**
 * Recently viewed projects — stored in localStorage.
 * Keeps the last N project IDs in order (most recent first).
 */
const KEY = 'rccs_recent_projects';
const MAX = 5;

export function recordProjectView(id: string): void {
  const current = getRecentProjectIds();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getRecentProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentProjects(): void {
  localStorage.removeItem(KEY);
}
