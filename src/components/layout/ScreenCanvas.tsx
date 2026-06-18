import React from 'react';

type ScreenCanvasVariant = 'standard' | 'wide' | 'cockpit' | 'calendar' | 'settings' | 'document';

const VARIANT_CLASS: Record<ScreenCanvasVariant, string> = {
  standard: 'max-w-6xl',
  wide: 'max-w-[92rem]',
  cockpit: 'max-w-[96rem]',
  calendar: 'max-w-[98rem]',
  settings: 'max-w-5xl',
  document: 'max-w-[90rem]',
};

interface ScreenCanvasProps {
  children: React.ReactNode;
  variant?: ScreenCanvasVariant;
  className?: string;
}

export default function ScreenCanvas({
  children,
  variant = 'standard',
  className = '',
}: ScreenCanvasProps) {
  return (
    <div className={`px-4 py-5 md:px-6 md:py-6 ${className}`}>
      <div className={`mx-auto space-y-6 md:space-y-7 ${VARIANT_CLASS[variant]}`}>
        {children}
      </div>
    </div>
  );
}
