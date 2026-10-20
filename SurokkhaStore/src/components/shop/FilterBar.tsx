import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ProductCategory } from '@/data/products'

export type ShopFilter = 'all' | ProductCategory

const filters: { value: ShopFilter; label: string }[] = [
  { value: 'all', label: 'সব' },
  { value: 'condom', label: 'কনডম' },
  { value: 'lube', label: 'লুব্রিকেন্ট' },
  { value: 'combo', label: 'কম্বো' },
]

export function FilterBar({
  value,
  onChange,
}: {
  value: ShopFilter
  onChange: (value: ShopFilter) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ShopFilter)}
      aria-label="পণ্য ফিল্টার"
      className="flex-wrap gap-2"
    >
      {filters.map((f) => (
        <ToggleGroupItem
          key={f.value}
          value={f.value}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {f.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
