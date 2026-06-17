import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';
import { Member } from '../types';

interface MemberSelectProps {
  members: Member[];
  value?: string;        // Member.id currently selected
  onChange: (id: string, displayName: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show a "None / unassigned" option */
  allowClear?: boolean;
}

export default function MemberSelect({
  members,
  value,
  onChange,
  placeholder = 'Select member…',
  className = '',
  required = false,
  disabled = false,
  allowClear = true,
}: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value);

  const filtered = search.trim()
    ? members.filter(
        (m) =>
          m.displayName.toLowerCase().includes(search.toLowerCase()) ||
          m.role.toLowerCase().includes(search.toLowerCase()) ||
          m.committee.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function select(m: Member) {
    onChange(m.id, m.displayName);
    setOpen(false);
    setSearch('');
  }

  function clear() {
    onChange('', '');
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
          ${open ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-900'}
          ${required && !value ? 'border-amber-600/50' : ''}
          text-left`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            {selected ? (
              <span className="text-xs text-slate-200 font-medium">
                {selected.displayName.charAt(0)}
              </span>
            ) : (
              <User size={11} className="text-slate-500" />
            )}
          </div>
          <span className={`truncate ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
            {selected ? selected.displayName : placeholder}
          </span>
          {selected && (
            <span className="text-xs text-slate-500 shrink-0 hidden sm:inline">
              · {selected.role}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800 rounded-md">
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none w-full"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {allowClear && (
              <button
                type="button"
                onClick={clear}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                <User size={13} /> None / Unassigned
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-500 text-center">No members found</p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => select(m)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-800 transition-colors
                    ${m.id === value ? 'bg-slate-800/60 text-blue-300' : 'text-slate-200'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-200">
                    {m.displayName.charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">{m.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {m.role} · {m.committee}
                    </p>
                  </div>
                  {m.id === value && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Utility: resolve a member ID to their display name, falling back to the raw string */
export function resolveMemberName(
  idOrName: string | undefined,
  members: Member[],
  fallback = 'Unassigned'
): string {
  if (!idOrName) return fallback;
  const m = members.find((x) => x.id === idOrName);
  return m ? m.displayName : idOrName || fallback;
}
