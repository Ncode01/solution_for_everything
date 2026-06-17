import React from 'react';

interface Props {
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function ProgressBar({ value, size = 'sm', showLabel = false }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500';
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>}
    </div>
  );
}
