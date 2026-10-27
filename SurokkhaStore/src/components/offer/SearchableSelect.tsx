import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface SelectOption {
  value: string
  /** Shown in the list; search matches both label and value */
  label: string
}

interface Props {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  invalid?: boolean
  emptyText?: string
  id?: string
  onClose?: () => void
}

/** Dropdown with a search box, keyboard navigation and outside-click close */
export function SearchableSelect({ value, options, onChange, placeholder, disabled, invalid, emptyText, id, onClose }: Props) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const q = query.trim().toLowerCase()
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  const current = options.find((o) => o.value === value)

  const close = () => {
    setOpen(false)
    onClose?.()
  }

  const openList = () => {
    if (disabled) return
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const choose = (v: string) => {
    onChange(v)
    setOpen(false)
    document.getElementById(triggerId)?.focus()
  }

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
            e.preventDefault()
            openList()
          }
        }}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-left text-sm outline-none transition focus:border-[#dc143c] focus:ring-2 focus:ring-[#dc143c]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          invalid ? 'border-[#dc143c]' : 'border-gray-300'
        }`}
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{current?.label || value || placeholder}</span>
        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 focus-within:border-[#dc143c] focus-within:bg-white">
              <Search className="size-4 shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                value={query}
                autoComplete="off"
                placeholder="খুঁজুন…"
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(a + 1, filtered.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(a - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filtered[active]) choose(filtered[active].value)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    close()
                    document.getElementById(triggerId)?.focus()
                  } else if (e.key === 'Tab') {
                    close()
                  }
                }}
                className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((o, i) => {
                const selected = o.value === value
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      choose(o.value)
                    }}
                    onMouseMove={() => setActive(i)}
                    className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm ${
                      i === active ? 'bg-[#dc143c]/10' : 'hover:bg-gray-50'
                    } ${selected ? 'font-medium text-[#b80f31]' : 'text-gray-700'}`}
                  >
                    {o.label}
                    {selected && <Check className="size-4 shrink-0" />}
                  </li>
                )
              })
            ) : (
              <li className="px-3.5 py-3 text-center text-sm text-gray-400">{emptyText ?? 'কোনো ফলাফল পাওয়া যায়নি'}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
