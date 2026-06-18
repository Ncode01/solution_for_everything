import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'apple-button-primary',
  secondary: 'apple-button-secondary',
  ghost: 'apple-button-ghost',
  danger: 'apple-button-danger',
  glass: 'apple-button-glass',
};

export default function LiquidButton({ variant = 'secondary', className = '', children, ...props }: Props) {
  return (
    <button className={`${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
