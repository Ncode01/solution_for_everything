import React, { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface Props {
  label?: string;
  actions: QuickAction[];
}

export default function QuickAddMenu({ label = 'Quick Add', actions }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-primary" onClick={() => setOpen((o) => !o)}>
        <Plus size={16} /> {label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 glass-panel-strong rounded-[var(--radius-lg)] shadow-2xl z-30 py-1.5 motion-safe-pop">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white transition-colors text-left"
            >
              {a.icon && <a.icon size={15} className="text-slate-500" />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
