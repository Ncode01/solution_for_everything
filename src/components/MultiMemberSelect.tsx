import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Users } from 'lucide-react';
import { Member } from '../types';

interface MultiMemberSelectProps {
  members: Member[];
  /** Selected member IDs */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplay?: number;
}

export default function MultiMemberSelect({
  members,
  value,
  onChange,
  placeholder = 'Select members…',
  className = '',
  disabled = false,
  maxDisplay = 3,
}: MultiMemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = members.filter((m) => value.includes(m.id));

  const filtered = search.trim()
    ? members.filter(
        (m) =>
          m.displayName.toLowerCase().includes(search.toLowerCase()) ||
          m.role.toLowerCase().includes(search.toLowerCase())
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

  function toggle(m: Member) {
    if (value.includes(m.id)) {
      onChange(value.filter((id) => id !== m.id));
    } else {
      onChange([...value, m.id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((i) => i !== id));
  }

  const displayedNames = selected.slice(0, maxDisplay);
  const extraCount = selected.length - maxDisplay;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`min-h-10 w-full flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
          ${open ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-900'}`}
      >
        {selected.length === 0 ? (
          <span className="text-slate-500 flex items-center gap-1.5">
            <Users size={13} /> {placeholder}
          </span>
        ) : (
          <>
            {displayedNames.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-1 bg-slate-700 text-slate-200 rounded-md px-2 py-0.5 text-xs"
              >
                {m.displayName}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                  className="text-slate-400 hover:text-red-400 transition-colors ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-xs text-slate-400">+{extraCount} more</span>
            )}
          </>
        )}
      </div>

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
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-500 text-center">No members found</p>
            ) : (
              filtered.map((m) => {
                const isSelected = value.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-800 transition-colors
                      ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                      ${isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-600'}`}
                    >
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold">
                      {m.displayName.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{m.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{m.role}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
