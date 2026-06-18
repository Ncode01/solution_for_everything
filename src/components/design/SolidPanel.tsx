import React from 'react';

type Props<T extends React.ElementType = 'div'> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export default function SolidPanel<T extends React.ElementType = 'div'>({
  as,
  children,
  className = '',
  interactive = false,
  ...props
}: Props<T>) {
  const Component = as ?? 'div';
  const hover = interactive ? 'transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-500/30' : '';
  return (
    <Component className={`solid-panel ${hover} ${className}`} {...props}>
      {children}
    </Component>
  );
}
