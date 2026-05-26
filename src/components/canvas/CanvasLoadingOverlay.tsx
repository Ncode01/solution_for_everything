"use client";

import { useUIStore } from "@/stores/ui.store";

export function CanvasLoadingOverlay() {
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const orgId = process.env.NEXT_PUBLIC_ORG_ID ?? "";

  if (!isCanvasLoading && !canvasError && orgId) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0E0D0C]/80">
      <div className="pointer-events-auto max-w-md rounded-xl border border-white/[0.08] bg-surface-container px-6 py-5 text-center shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {isCanvasLoading && (
          <>
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
            <p className="text-body-sm text-on-surface">Loading canvas…</p>
          </>
        )}
        {!isCanvasLoading && canvasError && (
          <>
            <p className="text-body-sm font-medium text-[#DD6974]">
              Failed to load canvas
            </p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              {canvasError}
            </p>
          </>
        )}
        {!isCanvasLoading && !canvasError && !orgId && (
          <>
            <p className="text-body-sm font-medium text-on-surface">
              Missing org configuration
            </p>
            <p className="text-body-sm mt-1 text-on-surface-variant">
              Set NEXT_PUBLIC_ORG_ID in .env.local (run pnpm db:seed to print
              the org id).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
