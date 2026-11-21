import { useEffect, useMemo, useRef, useState } from 'react'
import { L } from '@/lib/i18n'
import { DISTRICT_BN } from '@/data/districts'

/**
 * Dropdown picker (district / thana). The field itself is a button: tapping it
 * always opens the list, even when a value is already picked. Search lives
 * inside the open panel, and matches English or Bangla names.
 */
export default function LocationSelect({
  id,
  value,
  options,
  onSelect,
  onOpenChange,
  placeholder,
  disabled = false,
  error = '',
  emptyText = L('No matching results', 'কোনো মিল পাওয়া যায়নি'),
  searchPlaceholder = L('Search…', 'খুঁজুন… (বাংলা বা English)'),
}: {
  id?: string
  value: string
  options: string[]
  onSelect: (value: string) => void
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  clearLabel?: string
  emptyText?: string
  searchPlaceholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const setOpen = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
    if (!open) setQuery('')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q) || (DISTRICT_BN[o] || '').includes(q))
  }, [options, query])

  // Open: focus search, jump to the current value
  useEffect(() => {
    if (!isOpen) return
    const idx = Math.max(0, options.indexOf(value))
    setActive(idx)
    requestAnimationFrame(() => {
      const finePointer = window.matchMedia?.('(pointer: fine)').matches
      if (finePointer) searchRef.current?.focus({ preventScroll: true })
      listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'center' })
      rootRef.current?.scrollIntoView({ block: finePointer ? 'nearest' : 'start', behavior: 'smooth' })
    })
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => setActive(0), [query])

  const pick = (option: string) => {
    onSelect(option)
    setOpen(false)
  }

  const label = (o: string) => (DISTRICT_BN[o] ? `${DISTRICT_BN[o]} (${o})` : o)

  return (
    <div ref={rootRef} className={`relative scroll-mt-24 ${isOpen ? 'z-50' : 'z-20'}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        onClick={() => setOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 text-left text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-destructive' : isOpen ? 'border-primary ring-2 ring-ring/30' : 'border-input'
        }`}
      >
        <span className={`truncate ${value ? 'font-medium text-foreground' : 'text-foreground/60'}`}>{value ? label(value) : placeholder}</span>
        <svg className={`h-5 w-5 shrink-0 text-foreground/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl ring-1 ring-black/10">
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => Math.min(filtered.length - 1, a + 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => Math.max(0, a - 1))
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  if (filtered[active]) pick(filtered[active])
                } else if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-foreground/70">{emptyText}</div>
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
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-base transition ${
                    i === active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  } ${option === value ? 'font-bold' : ''}`}
                >
                  <span>{label(option)}</span>
                  {option === value && <span className="text-primary">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
