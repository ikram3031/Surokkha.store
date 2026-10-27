import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
      <span className="sr-only">Search products</span>
      <Input
        id={id}
        type="search"
        placeholder="Search products"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          inverted
            ? 'rounded-full border-background/20 bg-background/10 pl-10 pr-9 text-background placeholder:text-background/60'
            : 'rounded-full bg-background pl-10 pr-9 text-foreground'
        }
      />
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          inverted ? 'text-background/60' : 'text-muted-foreground'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            inverted
              ? 'text-background/60 hover:text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  )
}
