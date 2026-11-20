import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

export interface ShopCategoryOption {
  slug: string
  label: string
  count: number
}

interface Props {
  categories: ShopCategoryOption[]
  total: number
  category: string
  minPrice: string
  maxPrice: string
  priceBounds: [number, number]
  onCategory: (slug: string) => void
  onPrice: (min: string, max: string) => void
  onReset: () => void
}

const optionClass = (active: boolean) =>
  `flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
    active ? 'border-primary bg-secondary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:bg-secondary'
  }`

// Filter panel shared by the desktop sidebar and the mobile sheet
export const ShopFilters = ({ categories, total, category, minPrice, maxPrice, priceBounds, onCategory, onPrice, onReset }: Props) => (
  <div className="space-y-4">
    <Button type="button" variant="outline" className="w-full" onClick={onReset}>
      {L('Reset all filters', 'সব ফিল্টার রিসেট')}
    </Button>

    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{L('Categories', 'ক্যাটাগরি')}</h2>
      <div className="space-y-1">
        <button type="button" className={optionClass(category === 'all')} onClick={() => onCategory('all')}>
          <span>{L('All products', 'সব প্রোডাক্ট')}</span>
          <span>{bn(total)}</span>
        </button>
        {categories.map((c) => (
          <button key={c.slug} type="button" className={optionClass(category === c.slug)} onClick={() => onCategory(c.slug)}>
            <span>{c.label}</span>
            <span>{bn(c.count)}</span>
          </button>
        ))}
      </div>
    </section>

    {priceBounds[1] > priceBounds[0] && (
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{L('Price', 'মূল্য')}</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            placeholder={`৳${priceBounds[0]}`}
            aria-label={L('Minimum price', 'সর্বনিম্ন মূল্য')}
            onChange={(e) => onPrice(e.target.value, maxPrice)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            placeholder={`৳${priceBounds[1]}`}
            aria-label={L('Maximum price', 'সর্বোচ্চ মূল্য')}
            onChange={(e) => onPrice(minPrice, e.target.value)}
          />
        </div>
      </section>
    )}
  </div>
)
