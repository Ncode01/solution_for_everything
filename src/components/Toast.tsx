/**
 * Toast notification system.
 * Usage: import { useToast } from './Toast'; const { toast } = useToast();
 * toast.success('Saved!'); toast.error('Something went wrong'); toast.info('Note');
 *
 * Wrap app in <ToastProvider> and use useToast() anywhere.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastLevel = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  level: ToastLevel;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const add = useCallback((message: string, level: ToastLevel) => {
    const id = `toast-${++counter}`;
    setMessages((prev) => [...prev, { id, message, level }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const value: ToastContextValue = {
    toast: {
      success: (msg) => add(msg, 'success'),
      error: (msg) => add(msg, 'error'),
      info: (msg) => add(msg, 'info'),
      warning: (msg) => add(msg, 'warning'),
    },
  };

  const ICONS: Record<ToastLevel, React.ReactNode> = {
    success: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
    error:   <AlertCircle  size={16} className="text-red-400 shrink-0" />,
    info:    <Info         size={16} className="text-blue-400 shrink-0" />,
    warning: <AlertCircle  size={16} className="text-amber-400 shrink-0" />,
  };

  const BORDER: Record<ToastLevel, string> = {
    success: 'border-emerald-600/30',
    error:   'border-red-600/30',
    info:    'border-blue-600/30',
    warning: 'border-amber-600/30',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {messages.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 bg-slate-900 border ${BORDER[m.level]} rounded-xl px-4 py-3 shadow-2xl pointer-events-auto animate-slide-up`}
            >
              {ICONS[m.level]}
              <span className="text-sm text-slate-200 flex-1">{m.message}</span>
              <button
                onClick={() => dismiss(m.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
