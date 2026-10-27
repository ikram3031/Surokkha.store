import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCategories } from '@/hooks/useCategories'

/** 'all', a legacy bucket ('condom' | 'lube' | 'combo'), or an API category slug. */
export type ShopFilter = string

export function FilterBar({
  value,
  onChange,
}: {
  value: ShopFilter
  onChange: (value: ShopFilter) => void
}) {
  const categories = useCategories()
  const filters = [{ slug: 'all', label: 'সব' }, ...categories]

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      aria-label="পণ্য ফিল্টার"
      className="flex-wrap gap-2"
    >
      {filters.map((f) => (
        <ToggleGroupItem
          key={f.slug}
          value={f.slug}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {f.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
