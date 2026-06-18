import React from 'react';

type Tone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet';

const TONE: Record<Tone, string> = {
  neutral: 'bg-[var(--text-faint)] text-[var(--text-tertiary)]',
  blue: 'bg-[var(--accent)] text-[var(--accent)]',
  emerald: 'bg-[var(--success)] text-[var(--success)]',
  amber: 'bg-[var(--warning)] text-[var(--warning)]',
  red: 'bg-[var(--danger)] text-[var(--danger)]',
  violet: 'bg-[var(--launch)] text-[var(--launch)]',
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
        <span className={`h-1.5 w-1.5 rounded-full ${TONE[tone].split(' ')[0]}`} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${TONE[tone].split(' ').slice(1).join(' ')}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE[tone].split(' ')[0]}`} />
      {label}
    </span>
  );
}
