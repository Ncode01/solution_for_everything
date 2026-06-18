import React from 'react';

interface FinderViewProps {
  rail: React.ReactNode;
  list: React.ReactNode;
  preview: React.ReactNode;
}

export default function FinderView({ rail, list, preview }: FinderViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1.35fr)_minmax(280px,0.9fr)]">
      <div className="glass-panel rounded-[var(--radius-xl)] p-3">{rail}</div>
      <div className="solid-panel overflow-hidden rounded-[var(--radius-xl)]">{list}</div>
      <div className="glass-panel rounded-[var(--radius-xl)] p-4">{preview}</div>
    </div>
  );
}
