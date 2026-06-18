import React from 'react';

type CommandHeroTone = 'default' | 'attention' | 'launch' | 'money' | 'event' | 'system';

const TONE_CLASS: Record<CommandHeroTone, string> = {
  default: 'from-[rgba(122,167,255,0.12)] to-transparent',
  attention: 'from-[rgba(244,199,107,0.14)] to-transparent',
  launch: 'from-[rgba(183,156,255,0.14)] to-transparent',
  money: 'from-[rgba(66,211,146,0.12)] to-transparent',
  event: 'from-[rgba(255,107,107,0.12)] to-transparent',
  system: 'from-[rgba(255,255,255,0.08)] to-transparent',
};

interface CommandHeroMetric {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'launch';
}

interface CommandHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  tone?: CommandHeroTone;
  metrics?: CommandHeroMetric[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children?: React.ReactNode;
}

const METRIC_TONE: Record<NonNullable<CommandHeroMetric['tone']>, string> = {
  default: 'text-[var(--text-secondary)]',
  accent: 'text-[var(--accent)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  launch: 'text-[var(--launch)]',
};

export default function CommandHero({
  title,
  description,
  eyebrow,
  tone = 'default',
  metrics = [],
  primaryAction,
  secondaryActions,
  children,
}: CommandHeroProps) {
  return (
    <section className={`glass-shell relative overflow-hidden rounded-[var(--radius-2xl)] p-5 md:p-7`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${TONE_CLASS[tone]} opacity-80`} />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/10" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-4xl">
            {eyebrow && <p className="mb-2 text-[11px] font-semibold text-[var(--text-tertiary)]">{eyebrow}</p>}
            <h1 className="text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)] md:text-[2.1rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] md:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {(primaryAction || secondaryActions) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {secondaryActions}
              {primaryAction}
            </div>
          )}
        </div>

        {metrics.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-glass-strong)] px-4 py-3 shadow-[var(--shadow-inner-highlight)]"
              >
                <div className={`text-lg font-semibold ${METRIC_TONE[metric.tone ?? 'default']}`}>{metric.value}</div>
                <div className="mt-1 text-xs text-[var(--text-tertiary)]">{metric.label}</div>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
