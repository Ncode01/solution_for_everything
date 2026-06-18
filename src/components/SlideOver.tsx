import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SlideOver({ open, onClose, title, subtitle, children, footer }: SlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} aria-hidden />
      <aside
        className="motion-safe-slide absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--border-hairline)] glass-panel-strong shadow-2xl md:rounded-l-[var(--radius-2xl)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="glass-panel flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-hairline)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight text-[var(--text-primary)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text-primary)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-[var(--border-hairline)] px-5 py-4">{footer}</div>}
      </aside>
    </div>
  );
}
