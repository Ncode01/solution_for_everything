import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useAppData } from '../state/AppDataContext';
import { globalSearch } from '../lib/search';

export default function GlobalSearch() {
  const { data } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => globalSearch(data, query), [data, query]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setQuery('');
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function go(link: string) {
    navigate(link);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search… (Ctrl+K)"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
        >
          <X size={15} />
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-96 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No results for “{query}”.</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.link)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-800 text-left transition-colors"
              >
                <span className="text-[10px] uppercase font-semibold text-slate-500 w-16 shrink-0">{r.type}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-slate-200 truncate">{r.title}</span>
                  <span className="block text-xs text-slate-500 truncate">{r.subtitle}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
