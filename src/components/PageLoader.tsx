import React from 'react';
import { Hexagon } from 'lucide-react';

interface Props {
  message?: string;
}

export default function PageLoader({ message = 'Loading…' }: Props) {
  return (
    <div className="app-background min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl glass-panel-strong flex items-center justify-center animate-pulse">
        <Hexagon size={22} className="text-blue-400" />
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
