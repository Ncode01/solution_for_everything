import React from 'react';

interface MatrixProps {
  columns: React.ReactNode[];
  rows: React.ReactNode;
  className?: string;
}

export default function Matrix({ columns, rows, className = '' }: MatrixProps) {
  return (
    <div className={`solid-panel overflow-hidden rounded-[var(--radius-xl)] ${className}`}>
      <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(84px,1fr))] gap-3 border-b border-[var(--border-hairline)] px-4 py-3 text-[11px] font-semibold text-[var(--text-tertiary)] md:px-5">
        {columns.map((column, index) => (
          <div key={index}>{column}</div>
        ))}
      </div>
      <div>{rows}</div>
    </div>
  );
}
