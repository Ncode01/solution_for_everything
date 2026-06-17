import React from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

export default function PageHeader({ title, description, actions, backButton }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{title}</h1>
          {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}
