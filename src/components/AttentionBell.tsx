import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../state/AppDataContext';
import { buildAttention, countAttention } from '../lib/attention';
import { formatDateShort } from '../lib/dateUtils';

const TONE_DOT: Record<string, string> = {
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export default function AttentionBell() {
  const { data } = useAppData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => buildAttention(data), [data]);
  const total = countAttention(groups);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function go(link: string) {
    navigate(link);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative apple-button-glass p-2"
        title="Attention Center"
        aria-label="Attention Center"
      >
        <Bell size={19} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel-strong rounded-[var(--radius-lg)] shadow-2xl z-40 max-h-[70vh] overflow-y-auto motion-safe-pop">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 glass-panel-strong">
            <h3 className="text-sm font-semibold text-white">Attention Center</h3>
            <span className="text-xs text-slate-500">{total} item{total !== 1 ? 's' : ''}</span>
          </div>
          {total === 0 ? (
            <div className="px-4 py-10 text-center">
              <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All clear. Nothing needs attention right now.</p>
            </div>
          ) : (
            <div className="py-1">
              {groups.map((g) => (
                <div key={g.key} className="py-1">
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className={`w-2 h-2 rounded-full ${TONE_DOT[g.tone]}`} />
                    <p className="text-xs font-semibold text-slate-400">
                      {g.label} <span className="text-slate-600">({g.items.length})</span>
                    </p>
                  </div>
                  {g.items.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.link)}
                      className="w-full text-left px-4 py-1.5 hover:bg-white/8 transition-colors"
                    >
                      <p className="text-sm text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.meta}
                        {item.date && ` · ${formatDateShort(item.date)}`}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
