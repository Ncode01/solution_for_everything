import React from 'react';

interface EmptyMomentProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyMoment({ icon, title, description, action }: EmptyMomentProps) {
  return (
    <div className="glass-panel rounded-[var(--radius-xl)] px-5 py-10 text-center">
      {icon && <div className="mb-3 flex justify-center text-[var(--text-tertiary)]">{icon}</div>}
      <div className="text-base font-semibold text-[var(--text-primary)]">{title}</div>
      <div className="mx-auto mt-2 max-w-md text-sm text-[var(--text-tertiary)]">{description}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
