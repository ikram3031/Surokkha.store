import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { DISTRICT_BN } from './storeCompat.js';

// Shows a district in Bangla with its English name
const label = (o) => (DISTRICT_BN[o] ? `${DISTRICT_BN[o]} (${o})` : o);

// Searchable district dropdown for the special offer form; search matches Bangla or English names
const SpecialOfferDistrictPicker = forwardRef(function SpecialOfferDistrictPicker({ id, value, options, onSelect, onDismiss }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const setRoot = (el) => {
    rootRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  const close = (picked) => {
    setIsOpen(false);
    setQuery('');
    if (!picked) onDismiss?.();
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q) || (DISTRICT_BN[o] || '').includes(q)) : options;

  useEffect(() => {
    if (!isOpen) return undefined;
    const idx = Math.max(0, options.indexOf(value));
    setActive(idx);
    requestAnimationFrame(() => {
      const finePointer = window.matchMedia?.('(pointer: fine)').matches;
      if (finePointer) searchRef.current?.focus({ preventScroll: true });
      listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'center' });
      rootRef.current?.scrollIntoView({ block: finePointer ? 'nearest' : 'start', behavior: 'smooth' });
    });
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
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
    close(true);
  };

  return (
    <div ref={setRoot} className={`dpick${isOpen ? ' open' : ''}`}>
      <button type="button" id={id} className="dpick-btn" aria-haspopup="listbox" aria-expanded={isOpen} onClick={() => (isOpen ? close(false) : setIsOpen(true))}>
        <span className={value ? 'dpick-val' : 'dpick-ph'}>{value ? label(value) : 'জেলা নির্বাচন করুন'}</span>
      </button>
      {isOpen && (
        <div className="dpick-panel">
          <div className="dpick-search">
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              value={query}
              placeholder="জেলা খুঁজুন… (বাংলা বা English)"
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
                  close(false);
                }
              }}
            />
          </div>
          <div ref={listRef} role="listbox" className="dpick-list">
            {filtered.length === 0 ? (
              <div className="dpick-empty">কোনো জেলা পাওয়া যায়নি</div>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  data-idx={i}
                  className={`dpick-opt${i === active ? ' active' : ''}${option === value ? ' sel' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(option)}
                >
                  <span>{label(option)}</span>
                  {option === value && <span className="dpick-tick">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SpecialOfferDistrictPicker;
