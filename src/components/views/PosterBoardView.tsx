"use client";

import { colors, typography } from "@/design-system";
import { useCommandPalette } from "@/hooks/useCommandPalette";

export function PosterBoardView() {
  const { open } = useCommandPalette();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
        No poster briefs yet. Press ⌘B to create one.
      </p>
      <button
        type="button"
        onClick={open}
        className="rounded-lg border border-white/10 px-4 py-2 text-[13px] text-[#9898B0] hover:bg-white/5"
      >
        Open command palette
      </button>
    </div>
  );
}
