import { useRef, useState } from 'react'
import { L } from '@/lib/i18n'

/**
 * Searchable district / thana dropdown — ported from SurokkhaShop.
 * Only accepts a value that exists in `options`; free text that isn't an
 * option is discarded on blur. Much friendlier on mobile than a native
 * <select> with 60+ districts.
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
  clearLabel = L('Clear', 'মুছুন'),
  emptyText = L('No matching results', 'কোনো মিল পাওয়া যায়নি'),
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
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const setOpen = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))

  const pick = (option: string) => {
    onSelect(option)
    setQuery('')
    setOpen(false)
  }

  // Accept typed text only when it exactly matches an option, otherwise clear
  const commitTyped = () => {
    const typed = query.trim()
    if (!typed) {
      setOpen(false)
      return
    }
    const exact = options.find((o) => o.toLowerCase() === typed.toLowerCase())
    if (exact) pick(exact)
    else {
      onSelect('')
      setQuery('')
      setOpen(false)
    }
  }

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
          aria-invalid={!!error}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onBlur={() => setTimeout(commitTyped, 150)}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitTyped()
              inputRef.current?.blur()
            } else if (e.key === 'Escape') {
              setQuery('')
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
          className={`w-full cursor-pointer rounded-xl border bg-background px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-destructive' : 'border-input'
          } ${value && !isOpen ? 'placeholder:text-foreground' : ''}`}
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !disabled ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect('')
                setQuery('')
                setOpen(true)
                inputRef.current?.focus()
              }}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-destructive"
              title={clearLabel}
              aria-label={clearLabel}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="pointer-events-none p-1 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-2xl ring-1 ring-black/10">
          {filtered.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(option)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-accent hover:text-accent-foreground ${
                  option === value ? 'bg-accent font-bold text-accent-foreground' : 'text-foreground'
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
