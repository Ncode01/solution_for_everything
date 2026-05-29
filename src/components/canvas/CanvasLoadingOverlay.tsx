"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function CanvasLoadingOverlay() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const orgId = process.env.NEXT_PUBLIC_ORG_ID ?? "";

  const isSessionError = canvasError?.toLowerCase().includes("session");

  if (!isCanvasLoading && !canvasError && orgId) return null;

  const handleRetry = () => {
    useUIStore.getState().setCanvasError(null);
    void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
  };

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
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="text-body-sm rounded-lg border border-white/10 px-4 py-2 text-on-surface hover:bg-white/5"
              >
                Retry
              </button>
              {isSessionError ? (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary"
                >
                  Sign in
                </button>
              ) : null}
            </div>
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
