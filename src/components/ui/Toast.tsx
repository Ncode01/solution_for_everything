"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useUIStore, type ToastMessage } from "@/stores/ui.store";

const AUTO_DISMISS_MS = 3000;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(
      () => onDismiss(toast.id),
      AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.type === "error";

  return (
    <div
      className={
        isError
          ? "flex items-start gap-2 rounded-lg border border-error/30 bg-surface-container-high px-4 py-3 shadow-lg"
          : "flex items-start gap-2 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 shadow-lg"
      }
      role="status"
    >
      <p
        className={
          isError
            ? "text-body-sm flex-1 text-error"
            : "text-body-sm flex-1 text-on-surface"
        }
      >
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-on-surface-variant hover:text-on-surface"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
