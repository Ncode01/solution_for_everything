/**
 * Command Center design tokens — single source of truth for colors, type, spacing.
 * Component TSX files must reference these maps, not raw hex strings.
 */

// ── Raw color values (only referenced from this file) ─────────────────────────

const raw = {
  bg: {
    base: "#0A0A0F",
    surface: "#111118",
    elevated: "#1A1A24",
    hover: "#1F1F2E",
    selected: "#252535",
  },
  border: {
    subtle: "rgba(255,255,255,0.06)",
    default: "rgba(255,255,255,0.10)",
    strong: "rgba(255,255,255,0.18)",
    focus: "#6366F1",
  },
  text: {
    primary: "#F1F1F5",
    secondary: "#9898B0",
    tertiary: "#5A5A70",
    disabled: "#3A3A50",
    inverse: "#0A0A0F",
  },
  phase: {
    flash: "#F59E0B",
    fusion: "#8B5CF6",
    family: "#10B981",
  },
  status: {
    notStarted: "#3A3A50",
    inProgress: "#3B82F6",
    blocked: "#EF4444",
    inReview: "#F59E0B",
    done: "#10B981",
  },
  priority: {
    critical: "#EF4444",
    high: "#F97316",
    medium: "#3B82F6",
    low: "#6B7280",
  },
  poster: {
    brief: "#3A3A50",
    assigned: "#3B82F6",
    inProgress: "#F59E0B",
    submitted: "#8B5CF6",
    underReview: "#F97316",
    revision: "#EF4444",
    approved: "#10B981",
    published: "#059669",
  },
  accent: {
    indigo: "#6366F1",
    indigoHover: "#818CF8",
    indigoMuted: "rgba(99,102,241,0.15)",
  },
} as const;

// ── Tailwind class maps (derived from raw tokens) ─────────────────────────────

export const colors = {
  bg: {
    base: "bg-[#0A0A0F]",
    surface: "bg-[#111118]",
    elevated: "bg-[#1A1A24]",
    hover: "bg-[#1F1F2E]",
    selected: "bg-[#252535]",
  },
  border: {
    subtle: "border-white/[0.06]",
    default: "border-white/10",
    strong: "border-white/[0.18]",
    focus: "border-[#6366F1]",
    focusRing: "ring-2 ring-[#6366F1]",
  },
  text: {
    primary: "text-[#F1F1F5]",
    secondary: "text-[#9898B0]",
    tertiary: "text-[#5A5A70]",
    disabled: "text-[#3A3A50]",
    inverse: "text-[#0A0A0F]",
  },
  phase: {
    flash: "text-[#F59E0B]",
    fusion: "text-[#8B5CF6]",
    family: "text-[#10B981]",
    flashBg: "bg-[#F59E0B]",
    fusionBg: "bg-[#8B5CF6]",
    familyBg: "bg-[#10B981]",
    flashTint: "bg-[#F59E0B]/5",
    fusionTint: "bg-[#8B5CF6]/5",
    familyTint: "bg-[#10B981]/5",
    flashZone: "bg-[#F59E0B]/[0.03]",
    fusionZone: "bg-[#8B5CF6]/[0.03]",
    familyZone: "bg-[#10B981]/[0.03]",
  },
  status: {
    notStarted: "text-[#3A3A50]",
    inProgress: "text-[#3B82F6]",
    blocked: "text-[#EF4444]",
    inReview: "text-[#F59E0B]",
    done: "text-[#10B981]",
    notStartedBg: "bg-[#3A3A50]/20",
    inProgressBg: "bg-[#3B82F6]/15",
    blockedBg: "bg-[#EF4444]/15",
    inReviewBg: "bg-[#F59E0B]/15",
    doneBg: "bg-[#10B981]/15",
    notStartedDot: "bg-[#3A3A50]",
    inProgressDot: "bg-[#3B82F6]",
    blockedDot: "bg-[#EF4444]",
    inReviewDot: "bg-[#F59E0B]",
    doneDot: "bg-[#10B981]",
  },
  priority: {
    critical: "text-[#EF4444]",
    high: "text-[#F97316]",
    medium: "text-[#3B82F6]",
    low: "text-[#6B7280]",
    criticalStripe: "bg-[#EF4444]",
    highStripe: "bg-[#F97316]",
    mediumStripe: "bg-[#3B82F6]",
    lowStripe: "bg-[#6B7280]",
  },
  poster: {
    brief: "text-[#3A3A50]",
    assigned: "text-[#3B82F6]",
    inProgress: "text-[#F59E0B]",
    submitted: "text-[#8B5CF6]",
    underReview: "text-[#F97316]",
    revision: "text-[#EF4444]",
    approved: "text-[#10B981]",
    published: "text-[#059669]",
    briefBg: "bg-[#3A3A50]/10",
    assignedBg: "bg-[#3B82F6]/10",
    inProgressBg: "bg-[#F59E0B]/10",
    submittedBg: "bg-[#8B5CF6]/10",
    underReviewBg: "bg-[#F97316]/10",
    revisionBg: "bg-[#EF4444]/10",
    approvedBg: "bg-[#10B981]/10",
    publishedBg: "bg-[#059669]/10",
  },
  accent: {
    primary: "bg-[#6366F1]",
    primaryHover: "hover:bg-[#818CF8]",
    primaryText: "text-white",
    primaryMuted: "bg-[#6366F1]/15",
    primaryBorder: "border-[#6366F1]",
  },
} as const;

export const typography = {
  fontFamily: "'Inter Variable', system-ui, sans-serif",
  scale: {
    xs: { size: "11px", lineHeight: "1.4", weight: "400", class: "text-[11px] leading-[1.4] font-normal" },
    sm: { size: "12px", lineHeight: "1.5", weight: "400", class: "text-[12px] leading-[1.5] font-normal" },
    base: { size: "13px", lineHeight: "1.6", weight: "400", class: "text-[13px] leading-[1.6] font-normal" },
    md: { size: "14px", lineHeight: "1.5", weight: "500", class: "text-[14px] leading-[1.5] font-medium" },
    lg: { size: "16px", lineHeight: "1.4", weight: "600", class: "text-[16px] leading-[1.4] font-semibold" },
    xl: { size: "20px", lineHeight: "1.3", weight: "700", class: "text-[20px] leading-[1.3] font-bold" },
    "2xl": { size: "24px", lineHeight: "1.2", weight: "700", class: "text-[24px] leading-[1.2] font-bold" },
    "3xl": { size: "32px", lineHeight: "1.1", weight: "800", class: "text-[32px] leading-[1.1] font-extrabold" },
  },
  sectionHeader: "text-[10px] font-semibold uppercase tracking-[0.08em]",
} as const;

export const spacing = {
  0: "0",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "rounded-[4px]",
  md: "rounded-[8px]",
  lg: "rounded-[12px]",
  xl: "rounded-[16px]",
  full: "rounded-full",
} as const;

export const shadows = {
  card: "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]",
  elevated: "shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]",
  focus: "shadow-[0_0_0_2px_#6366F1]",
  drag: "shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
} as const;

export const motion = {
  fast: "duration-[80ms] ease-linear",
  normal: "duration-[160ms] ease-linear",
  slow: "duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
  spring: "duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
} as const;

// ── Layout dimensions ─────────────────────────────────────────────────────────

export const layout = {
  topbarHeight: "h-12",
  sidebarWidth: "w-[220px]",
  sidebarCollapsed: "w-12",
  detailPanelWidth: "w-[380px]",
} as const;

// ── Canvas zones (SparkIT phase regions) ──────────────────────────────────────

export const canvasZones = {
  flash: { xMin: 0, xMax: 650, tint: colors.phase.flashZone, label: "FLASH", labelX: 200, labelY: 50 },
  fusion: { xMin: 651, xMax: 1350, tint: colors.phase.fusionZone, label: "FUSION", labelX: 900, labelY: 50 },
  family: { xMin: 1351, xMax: 2100, tint: colors.phase.familyZone, label: "FAMILY", labelX: 1600, labelY: 50 },
} as const;

// ── Semantic zoom thresholds ──────────────────────────────────────────────────

export const zoomThresholds = {
  overview: 0.4,
  phase: 0.8,
} as const;

// ── Raw values for inline styles where Tailwind cannot express (SVG, canvas) ───

export const rawColors = raw;

export type TaskStatusKey = keyof typeof raw.status;
export type TaskPriorityKey = keyof typeof raw.priority;
export type PosterStatusKey = keyof typeof raw.poster;
export type PhaseKey = keyof typeof raw.phase;
