const ACCENT_COLORS = [
  "#818CF8",
  "#34D399",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
  "#38BDF8",
  "#4ADE80",
  "#FCD34D",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length]!;
}
