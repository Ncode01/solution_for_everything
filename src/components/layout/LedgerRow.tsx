import React from 'react';

interface LedgerRowProps {
  cells: React.ReactNode[];
}

export default function LedgerRow({ cells }: LedgerRowProps) {
  return (
    <div className="grid gap-2 border-b border-[var(--border-hairline)] px-4 py-3 text-sm text-[var(--text-secondary)] last:border-b-0 md:grid-cols-[110px_minmax(0,1.25fr)_140px_110px_120px_140px_100px_130px] md:gap-3 md:px-5">
      {cells.map((cell, index) => (
        <div key={index} className={index === 4 ? 'tabular-nums md:text-right' : index === 1 ? 'min-w-0' : ''}>
          {cell}
        </div>
      ))}
    </div>
  );
}
