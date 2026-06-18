import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface Props<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
  size = 'md',
}: Props<T>) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className={`control-segment ${className}`} role="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${sizeClass} ${
              selected
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/6'
            }`}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && <span className="text-[10px] opacity-65">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
