import React from 'react';

interface LedgerProps {
  columns: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export default function Ledger({ columns, children, className = '' }: LedgerProps) {
  return (
    <div className={`solid-panel overflow-hidden rounded-[var(--radius-xl)] ${className}`}>
      <div className="hidden grid-cols-[110px_minmax(0,1.25fr)_140px_110px_120px_140px_100px_130px] gap-3 border-b border-[var(--border-hairline)] px-4 py-3 text-[11px] font-semibold text-[var(--text-tertiary)] md:grid md:px-5">
        {columns.map((column, index) => (
          <div key={index} className={index === 4 ? 'text-right' : ''}>
            {column}
          </div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
