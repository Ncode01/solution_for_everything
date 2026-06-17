import React from 'react';
import { Hexagon } from 'lucide-react';

interface Props {
  message?: string;
}

export default function PageLoader({ message = 'Loading…' }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center animate-pulse">
        <Hexagon size={22} className="text-blue-400" />
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
