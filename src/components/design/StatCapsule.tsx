import React from 'react';

type Tone = 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'neutral';

const TONE: Record<Tone, string> = {
  blue: 'text-blue-300 bg-blue-500/10 border-blue-300/20',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-300/20',
  amber: 'text-amber-300 bg-amber-500/10 border-amber-300/20',
  red: 'text-red-300 bg-red-500/10 border-red-300/20',
  violet: 'text-violet-300 bg-violet-500/10 border-violet-300/20',
  neutral: 'text-slate-300 bg-white/5 border-white/10',
};

interface Props {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  trend?: string;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

export default function StatCapsule({ icon: Icon, label, value, trend, tone = 'neutral', onClick, className = '' }: Props) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`control-pill border ${TONE[tone]} ${onClick ? 'hover:-translate-y-0.5 text-left' : ''} ${className}`}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-tight">{value}</span>
        <span className="block text-[11px] opacity-70 truncate">{label}{trend ? ` · ${trend}` : ''}</span>
      </span>
    </Component>
  );
}
