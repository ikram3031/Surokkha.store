import { useRoute } from '@/lib/router'
import { useCategories } from '@/hooks/useCategories'
import { L } from '@/lib/i18n'

// Category menu under the header: one item per top-level category, scrolls sideways on small screens
export const CategoryBar = ({ onCategory }: { onCategory: (slug: string) => void }) => {
  const categories = useCategories()
  const route = useRoute()
  if (categories.length === 0) return null

  return (
    <nav className="border-t border-white/10" aria-label={L('Categories', 'ক্যাটাগরি')}>
      <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const active = route.name === 'category' && route.slug === c.slug
          return (
            <li key={c.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => onCategory(c.slug)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
