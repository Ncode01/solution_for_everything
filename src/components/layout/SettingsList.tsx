import React from 'react';

interface SettingsListProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export default function SettingsList({ title, children }: SettingsListProps) {
  return (
    <section className="space-y-3">
      <div className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</div>
      <div className="solid-panel overflow-hidden rounded-[var(--radius-xl)]">{children}</div>
    </section>
  );
}
