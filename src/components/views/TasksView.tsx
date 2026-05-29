"use client";

import { colors, typography, buttonVariants } from "@/design-system";
import { useUIStore } from "@/stores/ui.store";

export function TasksView() {
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <EmptyIllustration />
      <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
        No tasks yet. Press N to create one.
      </p>
      <button type="button" className={buttonVariants.primary} onClick={() => openTaskCreate()}>
        Create Task
      </button>
    </div>
  );
}

function EmptyIllustration() {
  return (
    <div className="relative h-24 w-24" aria-hidden>
      <div className={`absolute inset-0 rounded-xl ${colors.bg.elevated} border border-white/10`} />
      <div className={`absolute left-3 top-3 h-3 w-16 rounded ${colors.bg.hover}`} />
      <div className={`absolute left-3 top-8 h-3 w-12 rounded ${colors.bg.hover}`} />
      <div className={`absolute left-3 top-12 h-3 w-14 rounded ${colors.bg.hover}`} />
    </div>
  );
}
