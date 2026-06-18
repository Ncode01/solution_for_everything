import React from 'react';

type Tone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet';

const TONE: Record<Tone, string> = {
  neutral: 'bg-slate-500 text-slate-400',
  blue: 'bg-blue-400 text-blue-300',
  emerald: 'bg-emerald-400 text-emerald-300',
  amber: 'bg-amber-400 text-amber-300',
  red: 'bg-red-400 text-red-300',
  violet: 'bg-violet-400 text-violet-300',
};

interface Props {
  label: string;
  tone?: Tone;
  lozenge?: boolean;
}

export default function StatusDot({ label, tone = 'neutral', lozenge = false }: Props) {
  if (lozenge) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-current/10 px-2 py-0.5 text-xs font-medium ${TONE[tone].split(' ').slice(1).join(' ')}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${TONE[tone].split(' ')[0]}`} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${TONE[tone].split(' ').slice(1).join(' ')}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${TONE[tone].split(' ')[0]}`} />
      {label}
    </span>
  );
}
