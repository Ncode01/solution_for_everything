import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'solid' | 'glass';
};

export default function LiquidInput({ className = '', variant = 'solid', ...props }: Props) {
  const variantClass = variant === 'glass' ? 'bg-white/5 backdrop-blur-xl' : '';
  return <input className={`apple-input ${variantClass} ${className}`} {...props} />;
}
