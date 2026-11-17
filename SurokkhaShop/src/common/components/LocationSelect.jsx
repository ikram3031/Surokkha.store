import React, { useState, useEffect, useRef } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { DISTRICT_THANAS, DISTRICT_BN } from '../data/districts';
import { registerThanaCharges } from '../utils/deliveryCharge';

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
        if (Array.isArray(json?.data)) registerThanaCharges(district, json.data);
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

// Dropdown picker: the field is a button that always opens the list (even when a value is picked);
// search lives inside the open panel and matches Bangla or English names
export default function LocationSelect({
  id,
  value,
  options,
  onSelect,
  onOpenChange,
  placeholder,
  disabled = false,
  error = '',
  emptyText = 'No results',
  searchPlaceholder = 'খুঁজুন… (বাংলা বা English)',
  inputClassName = 'bg-zinc-50',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const setOpen = (open) => {
    setIsOpen(open);
    onOpenChange?.(open);
    if (!open) setQuery('');
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q) || (DISTRICT_BN[o] || '').includes(q)) : options;
  const label = (o) => (DISTRICT_BN[o] ? `${DISTRICT_BN[o]} (${o})` : o);

  useEffect(() => {
    if (!isOpen) return undefined;
    const idx = Math.max(0, options.indexOf(value));
    setActive(idx);
    requestAnimationFrame(() => {
      searchRef.current?.focus({ preventScroll: true });
      listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'center' });
      rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => setActive(0), [query]);

  const pick = (option) => {
    onSelect(option);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? 'z-50' : 'z-20'}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        onClick={() => setOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-left text-base border rounded-xl px-4 py-3 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName} ${
          error ? 'border-rose-500' : isOpen ? 'border-brand-700 ring-2 ring-brand-700/30' : 'border-zinc-300'
        }`}
      >
        <span className={`truncate ${value ? 'font-semibold text-zinc-900' : 'text-zinc-500'}`}>{value ? label(value) : placeholder}</span>
        <svg className={`w-5 h-5 shrink-0 text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-zinc-200 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
          <div className="p-2 border-b border-zinc-100">
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(filtered.length - 1, a + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(0, a - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filtered[active]) pick(filtered[active]);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              className="w-full text-base bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
            />
          </div>
          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-600">{emptyText}</div>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(option)}
                  className={`w-full flex items-center justify-between text-left px-4 py-3 text-base transition cursor-pointer ${
                    i === active ? 'bg-brand-50 text-brand-900' : 'text-zinc-800'
                  } ${option === value ? 'font-bold' : ''}`}
                >
                  <span>{label(option)}</span>
                  {option === value && <span className="text-brand-700">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-rose-600 font-semibold">{error}</p>}
    </div>
  );
}
