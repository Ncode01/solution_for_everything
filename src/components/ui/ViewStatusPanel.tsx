"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ViewStatusPanelProps {
  icon: LucideIcon;
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ViewStatusPanel({
  icon: Icon,
  title,
  message,
  onRetry,
  retryLabel = "Try again",
}: ViewStatusPanelProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-container-low p-8 text-center">
      <Icon className="text-outline" size={32} aria-hidden />
      <h1 className="text-body-md font-medium text-on-surface">{title}</h1>
      <p className="text-body-sm max-w-md text-on-surface-variant">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-body-sm flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-on-surface hover:bg-white/5"
        >
          <RefreshCw size={14} aria-hidden />
          {retryLabel}
        </button>
      ) : null}
    </main>
  );
}

export function ViewErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <ViewStatusPanel
      icon={AlertCircle}
      title="Could not load data"
      message={message}
      onRetry={onRetry}
    />
  );
}
