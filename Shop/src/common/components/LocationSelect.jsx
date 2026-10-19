import React, { useState, useEffect, useRef } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { DISTRICT_THANAS } from '../data/districts';

const thanaCache = {};

// Loads thana/upazila options for a district from the backend, falling back to the bundled list
export function useThanas(district) {
  const [state, setState] = useState({ options: [], loading: false });

  useEffect(() => {
    if (!district) {
      setState({ options: [], loading: false });
      return;
    }
    if (thanaCache[district]) {
      setState({ options: thanaCache[district], loading: false });
      return;
    }

    let cancelled = false;
    const fallback = (DISTRICT_THANAS[district] || []).map((t) => t.name);
    setState({ options: fallback, loading: true });

    const cleanBase = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
    fetch(`${cleanBase}/api/v1/locations/districts/${encodeURIComponent(district)}/thanas`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const names = Array.isArray(json?.data) ? json.data.map((t) => t.name).filter(Boolean) : [];
        const options = names.length > 0 ? names : fallback;
        if (options.length > 0) thanaCache[district] = options;
        if (!cancelled) setState({ options, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ options: fallback, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  return state;
}

// Searchable dropdown that only accepts a value picked from `options`; typed text that isn't an option is cleared
export default function LocationSelect({
  id,
  value,
  options,
  onSelect,
  onOpenChange,
  placeholder,
  disabled = false,
  error = '',
  clearLabel = 'Clear',
  emptyText = 'No results',
  inputClassName = 'bg-slate-50 focus:bg-white',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const setOpen = (open) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  const pick = (option) => {
    onSelect(option);
    setQuery('');
    setOpen(false);
  };

  // Accept typed text only when it exactly matches an option, otherwise leave the field empty
  const commitTyped = () => {
    const typed = query.trim();
    if (!typed) {
      setOpen(false);
      return;
    }
    const exact = options.find((o) => o.toLowerCase() === typed.toLowerCase());
    if (exact) {
      pick(exact);
    } else {
      onSelect('');
      setQuery('');
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-20'}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          autoComplete="off"
          disabled={disabled}
          placeholder={value || placeholder}
          value={isOpen ? query : value || ''}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onBlur={() => setTimeout(commitTyped, 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitTyped();
              inputRef.current?.blur();
            } else if (e.key === 'Escape') {
              setQuery('');
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          className={`w-full text-xs sm:text-sm border ${error ? 'border-rose-500' : 'border-slate-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition pr-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName} ${value && !isOpen ? 'placeholder:text-slate-900' : ''}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect('');
                setQuery('');
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
              title={clearLabel}
              aria-label={clearLabel}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="pointer-events-none text-slate-400 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl z-[9999] py-1 shadow-2xl divide-y divide-slate-100 scrollbar-thin ring-1 ring-black/10">
          {filtered.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-500">{emptyText}</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(option);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs transition cursor-pointer hover:text-brand-900 hover:bg-brand-50 ${option === value ? 'bg-brand-50 text-brand-900 font-bold' : 'bg-white text-slate-700'}`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{error}</p>}
    </div>
  );
}
