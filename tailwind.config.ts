import type { Config } from "tailwindcss";
import { rawColors } from "./src/design-system/tokens";

/**
 * Command Center design tokens — Tailwind bridge.
 * Semantic classes for new UI; legacy FlowCanvas tokens retained for gradual migration.
 */
const namedColors = {
  // Command Center (design-system/tokens.ts)
  "cc-base": rawColors.bg.base,
  "cc-surface": rawColors.bg.surface,
  "cc-elevated": rawColors.bg.elevated,
  "cc-hover": rawColors.bg.hover,
  "cc-selected": rawColors.bg.selected,
  "cc-text-primary": rawColors.text.primary,
  "cc-text-secondary": rawColors.text.secondary,
  "cc-text-tertiary": rawColors.text.tertiary,
  "cc-accent": rawColors.accent.indigo,
  "cc-phase-flash": rawColors.phase.flash,
  "cc-phase-fusion": rawColors.phase.fusion,
  "cc-phase-family": rawColors.phase.family,
  // Legacy FlowCanvas (migration)
  "surface-container-lowest": "#0e0e0d",
  "surface-container-low": "#1b1c1a",
  "surface-container": "#1f201e",
  "surface-container-high": "#2a2a29",
  "surface-container-highest": "#353533",
  "on-surface": "#e5e2df",
  "on-surface-variant": "#bec8ca",
  "on-primary": "#00363d",
  primary: "#8ad2de",
  outline: "#899294",
  "outline-variant": "#3f484a",
  coral: "#E05C5C",
  amber: "#E8AF34",
  violet: "#A86FDF",
  sky: "#5591C7",
  mint: "#6DAA45",
  blocked: "#E8AF34",
  done: "#6DAA45",
  "in-review": "#A86FDF",
  destructive: "#DD6974",
  error: "#DD6974",
  "tertiary-container": "#E05C5C",
  "on-tertiary-container": "#ffffff",
} as const;

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: namedColors,
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        "mono-label": ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "section-header": [
          "11px",
          { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.08em" },
        ],
        "mono-label": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "headline-sm": ["18px", { lineHeight: "26px", fontWeight: "500" }],
        "display-lg": [
          "32px",
          { lineHeight: "40px", fontWeight: "600", letterSpacing: "-0.02em" },
        ],
      },
      width: {
        sidebar: "260px",
        "task-panel": "360px",
      },
      height: {
        topbar: "48px",
        "compact-row": "32px",
      },
      borderRadius: {
        card: "0.75rem", // rounded-xl — canvas nodes
        panel: "0.5rem", // rounded-lg — panel lists
      },
      boxShadow: {
        "status-in-progress": "0 0 0 1px rgba(79, 152, 163, 0.4)",
      },
      backgroundImage: {
        "canvas-dots":
          "radial-gradient(circle, rgba(205,204,202,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "canvas-dots": "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
export { namedColors };
