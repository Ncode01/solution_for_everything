/**
 * Typed component variant maps — consume tokens; never hardcode colors in components.
 */

import {
  colors,
  layout,
  motion,
  radius,
  shadows,
  typography,
} from "./tokens";
import type { PosterStatusKey, TaskPriorityKey, TaskStatusKey } from "./tokens";

// ── Shared base classes ───────────────────────────────────────────────────────

export const surface = {
  base: colors.bg.base,
  card: `${colors.bg.surface} ${colors.border.subtle} border ${radius.lg} ${shadows.card}`,
  elevated: `${colors.bg.elevated} ${colors.border.default} border ${radius.xl} ${shadows.elevated}`,
  panel: `${colors.bg.surface} ${colors.border.subtle} border-r`,
  hover: "hover:bg-[#1F1F2E] hover:border-white/10",
} as const;

export const focusRing = `${colors.border.focus} ${shadows.focus} outline-none`;

// ── Button variants ───────────────────────────────────────────────────────────

export const buttonVariants = {
  primary: [
    colors.accent.primary,
    colors.accent.primaryHover,
    colors.accent.primaryText,
    radius.md,
    typography.scale.sm.class,
    "font-medium",
    "px-4 py-2",
    "transition-colors",
    motion.fast,
  ].join(" "),
  ghost: [
    colors.border.default,
    "border",
    colors.text.secondary,
    "hover:bg-white/5",
    colors.text.primary,
    radius.md,
    typography.scale.sm.class,
    "px-4 py-2",
    motion.fast,
  ].join(" "),
  destructive: [
    "border border-[#EF4444]/40",
    "text-[#EF4444]",
    "hover:bg-[#EF4444]/10",
    radius.md,
    typography.scale.sm.class,
    "px-4 py-2",
    motion.fast,
  ].join(" "),
  icon: [
    "p-2",
    radius.md,
    colors.text.secondary,
    "hover:bg-white/5",
    colors.text.primary,
    motion.fast,
  ].join(" "),
  fab: [
    "h-12 w-12",
    radius.full,
    colors.accent.primary,
    colors.accent.primaryHover,
    colors.accent.primaryText,
    shadows.elevated,
    "flex items-center justify-center",
    motion.spring,
  ].join(" "),
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

// ── Input variants ────────────────────────────────────────────────────────────

export const inputVariants = {
  default: [
    colors.bg.surface,
    colors.border.default,
    "border",
    radius.md,
    "h-9",
    "px-3",
    typography.scale.base.class,
    colors.text.primary,
    "placeholder:" + colors.text.tertiary,
    `focus:${colors.border.focus}`,
    `focus:${shadows.focus}`,
    motion.fast,
  ].join(" "),
  search: [
    colors.bg.elevated,
    "border-0",
    radius.lg,
    "h-9",
    "px-10",
    typography.scale.md.class.replace("font-medium", "font-normal"),
    colors.text.primary,
    "placeholder:" + colors.text.secondary,
    motion.fast,
  ].join(" "),
  textarea: [
    colors.bg.surface,
    colors.border.default,
    "border",
    radius.md,
    "min-h-[80px]",
    "px-3 py-2",
    typography.scale.base.class,
    colors.text.primary,
    `focus:${colors.border.focus}`,
    motion.fast,
  ].join(" "),
} as const;

export type InputVariant = keyof typeof inputVariants;

// ── Badge / pill variants ─────────────────────────────────────────────────────

const statusBadgeMap: Record<TaskStatusKey, string> = {
  notStarted: `${colors.status.notStartedBg} ${colors.status.notStarted} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  inProgress: `${colors.status.inProgressBg} ${colors.status.inProgress} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  blocked: `${colors.status.blockedBg} ${colors.status.blocked} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  inReview: `${colors.status.inReviewBg} ${colors.status.inReview} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  done: `${colors.status.doneBg} ${colors.status.done} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
};

const priorityBadgeMap: Record<TaskPriorityKey, string> = {
  critical: `${colors.priority.critical} ${typography.scale.xs.class}`,
  high: `${colors.priority.high} ${typography.scale.xs.class}`,
  medium: `${colors.priority.medium} ${typography.scale.xs.class}`,
  low: `${colors.priority.low} ${typography.scale.xs.class}`,
};

const posterBadgeMap: Record<PosterStatusKey, string> = {
  brief: `${colors.poster.briefBg} ${colors.poster.brief}`,
  assigned: `${colors.poster.assignedBg} ${colors.poster.assigned}`,
  inProgress: `${colors.poster.inProgressBg} ${colors.poster.inProgress}`,
  submitted: `${colors.poster.submittedBg} ${colors.poster.submitted}`,
  underReview: `${colors.poster.underReviewBg} ${colors.poster.underReview}`,
  revision: `${colors.poster.revisionBg} ${colors.poster.revision}`,
  approved: `${colors.poster.approvedBg} ${colors.poster.approved}`,
  published: `${colors.poster.publishedBg} ${colors.poster.published}`,
};

export const badgeVariants = {
  status: statusBadgeMap,
  priority: priorityBadgeMap,
  poster: posterBadgeMap,
  neutral: `${colors.bg.hover} ${colors.text.secondary} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  phase: {
    flash: `${colors.phase.flashTint} ${colors.phase.flash} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
    fusion: `${colors.phase.fusionTint} ${colors.phase.fusion} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
    family: `${colors.phase.familyTint} ${colors.phase.family} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`,
  },
} as const;

export function statusBadgeClass(status: TaskStatusKey): string {
  return statusBadgeMap[status];
}

export function priorityStripeClass(priority: TaskPriorityKey): string {
  const map = {
    critical: colors.priority.criticalStripe,
    high: colors.priority.highStripe,
    medium: colors.priority.mediumStripe,
    low: colors.priority.lowStripe,
  } as const;
  return map[priority];
}

export function posterBadgeClass(status: PosterStatusKey): string {
  return `${posterBadgeMap[status]} ${radius.full} px-2 py-0.5 ${typography.scale.xs.class}`;
}

// ── Node variants (canvas) ────────────────────────────────────────────────────

export const nodeVariants = {
  base: [
    colors.bg.surface,
    colors.border.subtle,
    "border",
    radius.lg,
    shadows.card,
    motion.normal,
  ].join(" "),
  selected: [colors.border.focusRing, shadows.focus].join(" "),
  hover: [colors.bg.hover, colors.border.default].join(" "),
  dragging: [shadows.drag, "scale-[1.02]", "opacity-100"].join(" "),
  dimmed: "opacity-80",
  blockedGlow: "border-t-2 border-[#EF4444] shadow-[0_-2px_8px_rgba(239,68,68,0.3)]",
  done: "opacity-40 line-through",
  external: "border-dashed border-2",
} as const;

// ── Modal / command palette ───────────────────────────────────────────────────

export const modalVariants = {
  backdrop: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
  container: [
    colors.bg.elevated,
    colors.border.default,
    "border",
    radius.xl,
    shadows.elevated,
    "w-full max-w-[560px]",
  ].join(" "),
  commandPalette: [
    colors.bg.elevated,
    colors.border.default,
    "border",
    radius.xl,
    shadows.elevated,
    "w-[560px]",
  ].join(" "),
} as const;

// ── Table (tasks list) ────────────────────────────────────────────────────────

export const tableVariants = {
  header: `${typography.sectionHeader} ${colors.text.tertiary} px-3 py-2`,
  row: `h-9 ${colors.bg.surface} hover:bg-[#1F1F2E] cursor-pointer ${motion.fast}`,
  rowAlt: `h-9 ${colors.bg.hover} hover:bg-[#252535] cursor-pointer ${motion.fast}`,
  cell: `px-3 ${typography.scale.sm.class} ${colors.text.primary}`,
} as const;

// ── Topbar / sidebar / detail panel ───────────────────────────────────────────

export const shellVariants = {
  topbar: [
    layout.topbarHeight,
    colors.bg.surface,
    colors.border.subtle,
    "border-b",
    "flex items-center shrink-0 px-4",
  ].join(" "),
  sidebar: [
    layout.sidebarWidth,
    colors.bg.base,
    colors.border.subtle,
    "border-r",
    "flex flex-col shrink-0",
    motion.slow,
  ].join(" "),
  sidebarCollapsed: [
    layout.sidebarCollapsed,
    colors.bg.base,
    colors.border.subtle,
    "border-r",
    motion.slow,
  ].join(" "),
  detailPanel: [
    layout.detailPanelWidth,
    colors.bg.surface,
    colors.border.subtle,
    "border-l",
    "flex flex-col h-full shrink-0",
    motion.slow,
  ].join(" "),
  main: `flex-1 overflow-hidden ${colors.bg.base}`,
} as const;

// ── Toast ─────────────────────────────────────────────────────────────────────

export const toastVariants = {
  success: "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]",
  error: "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]",
  info: "bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#3B82F6]",
  warning: "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]",
  base: `${radius.lg} border px-4 py-3 ${typography.scale.sm.class} ${shadows.elevated}`,
} as const;

export type ToastVariant = keyof Omit<typeof toastVariants, "base">;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const skeletonVariants = {
  base: `${colors.bg.elevated} ${radius.md} animate-pulse`,
  shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
} as const;

// ── Tab strip (detail panel) ──────────────────────────────────────────────────

export const tabVariants = {
  strip: `flex h-9 border-b ${colors.border.subtle} gap-1 px-4`,
  tab: `${typography.scale.sm.class} ${colors.text.secondary} px-3 py-2 ${motion.fast} hover:text-[#F1F1F5]`,
  tabActive: `${typography.scale.sm.class} ${colors.text.primary} border-b-2 ${colors.accent.primaryBorder} px-3 py-2`,
} as const;

// ── Form field labels ─────────────────────────────────────────────────────────

export const formVariants = {
  label: `${typography.sectionHeader} ${colors.text.secondary} mb-2 block`,
  error: `${typography.scale.xs.class} text-[#EF4444] mt-1`,
  footer: `flex justify-end gap-2 pt-4 border-t ${colors.border.subtle}`,
} as const;

// ── Canvas toolbar pill ───────────────────────────────────────────────────────

export const canvasToolbarVariants = {
  pill: [
    colors.bg.elevated,
    shadows.elevated,
    radius.full,
    "flex items-center gap-1 px-2 py-1",
  ].join(" "),
  chip: [
    colors.bg.selected,
    colors.text.primary,
    radius.full,
    typography.scale.xs.class,
    "px-2 py-1 flex items-center gap-1",
  ].join(" "),
} as const;
