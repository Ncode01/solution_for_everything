"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

interface ShortcutRow {
  keys: string[];
  label: string;
}

interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

const SECTIONS: ShortcutSection[] = [
  {
    title: "Navigation",
    rows: [
      { keys: ["G", "C"], label: "Open canvas" },
      { keys: ["G", "G"], label: "Open Gantt" },
      { keys: ["G", "D"], label: "Open dashboard" },
    ],
  },
  {
    title: "Canvas",
    rows: [
      { keys: ["Shift", "C"], label: "Fit view" },
      { keys: ["Shift", "W"], label: "Toggle workload layer" },
      { keys: ["T"], label: "New task" },
      { keys: ["E"], label: "Edit selected task" },
      { keys: ["Esc"], label: "Close panel / deselect" },
    ],
  },
  {
    title: "Global",
    rows: [
      { keys: ["⌘", "K"], label: "Command palette" },
      { keys: ["?"], label: "This help overlay" },
    ],
  },
];

function KeyPill({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-white/[0.12] bg-surface-container px-1.5 py-0.5 font-mono text-[10px] font-medium text-on-surface">
      {children}
    </kbd>
  );
}

export function KeyboardHelpOverlay() {
  const showKeyboardHelp = useUIStore((s) => s.showKeyboardHelp);
  const toggleKeyboardHelp = useUIStore((s) => s.toggleKeyboardHelp);

  useEffect(() => {
    if (!showKeyboardHelp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleKeyboardHelp(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showKeyboardHelp, toggleKeyboardHelp]);

  if (!showKeyboardHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => toggleKeyboardHelp(false)}
    >
      <div
        className="w-[560px] max-w-full rounded-2xl border border-white/[0.08] bg-surface-container-high p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-headline-sm mb-4 font-medium text-on-surface">
          Keyboard shortcuts
        </h2>
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-section-header mb-2 uppercase text-on-surface-variant">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-body-sm text-on-surface-variant">
                      {row.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {row.keys.map((key, i) => (
                        <KeyPill key={`${row.label}-${key}-${i}`}>{key}</KeyPill>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-body-sm mt-6 text-outline">
          Press <KeyPill>?</KeyPill> or <KeyPill>Esc</KeyPill> to close
        </p>
      </div>
    </div>
  );
}
