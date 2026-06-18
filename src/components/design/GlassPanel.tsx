import React from 'react';

type Strength = 'subtle' | 'medium' | 'strong';

type Props<T extends React.ElementType = 'div'> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  strength?: Strength;
  interactive?: boolean;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const STRENGTH_CLASS: Record<Strength, string> = {
  subtle: 'glass-panel bg-opacity-60',
  medium: 'glass-panel',
  strong: 'glass-panel-strong',
};

export default function GlassPanel<T extends React.ElementType = 'div'>({
  as,
  children,
  className = '',
  strength = 'medium',
  interactive = false,
  ...props
}: Props<T>) {
  const Component = as ?? 'div';
  const hover = interactive ? 'transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300/25' : '';
  return (
    <Component className={`${STRENGTH_CLASS[strength]} rounded-[var(--radius-lg)] ${hover} ${className}`} {...props}>
      {children}
    </Component>
  );
}
