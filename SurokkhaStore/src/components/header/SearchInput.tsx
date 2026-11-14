import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { L } from '@/lib/i18n'

export function SearchInput({
  value,
  onChange,
  className = '',
  id,
  tone = 'default',
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
  /** 'default' sits on a light surface; 'inverted' sits on a dark surface (e.g. the mobile nav sheet). */
  tone?: 'default' | 'inverted'
}) {
  const inverted = tone === 'inverted'

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{L('Search products', 'প্রোডাক্ট খুঁজুন')}</span>
      <Input
        id={id}
        type="search"
        placeholder={L('Search products', 'প্রোডাক্ট খুঁজুন')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          inverted
            ? 'rounded-full border-white/30 bg-white/15 pl-10 pr-9 text-white placeholder:text-white/60'
            : 'rounded-full bg-background pl-10 pr-9 text-foreground'
        }
      />
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          inverted ? 'text-white/60' : 'text-muted-foreground'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={L('Clear search', 'সার্চ মুছুন')}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            inverted
              ? 'text-white/60 hover:text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  )
}
