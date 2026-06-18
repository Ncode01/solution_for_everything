import React from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

export default function PageHeader({ title, description, actions, backButton }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap motion-safe-slide">
      <div className="flex items-start gap-3 min-w-0">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-normal">{title}</h1>
          {description && <p className="text-[var(--text-tertiary)] text-sm mt-1 max-w-3xl text-balance">{description}</p>}
        </div>
      </div>
      {actions && <div className="floating-control flex items-center gap-2 flex-wrap shrink-0 p-1.5">{actions}</div>}
    </div>
  );
}
