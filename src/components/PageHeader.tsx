import React from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

export default function PageHeader({ title, description, actions, backButton }: Props) {
  return (
    <div className="motion-safe-slide flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-[var(--text-primary)] md:text-[28px]">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-[var(--text-tertiary)] text-balance">{description}</p>}
        </div>
      </div>
      {actions && <div className="floating-control flex shrink-0 flex-wrap items-center gap-2 p-1.5">{actions}</div>}
    </div>
  );
}
