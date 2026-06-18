import React from 'react';

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value?: React.ReactNode;
  detail?: React.ReactNode;
  status?: React.ReactNode;
  action?: React.ReactNode;
}

export default function SettingsRow({
  icon,
  label,
  value,
  detail,
  status,
  action,
}: SettingsRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] px-4 py-3 last:border-b-0 md:px-5">
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-secondary)]">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {detail && <div className="mt-1 text-xs text-[var(--text-tertiary)]">{detail}</div>}
      </div>
      {status && <div className="hidden md:block">{status}</div>}
      {value && <div className="text-right text-sm text-[var(--text-secondary)]">{value}</div>}
      {action}
    </div>
  );
}
