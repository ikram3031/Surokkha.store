import { User } from 'lucide-react'
import { SearchInput } from '@/components/header/SearchInput'
import { useCategories } from '@/hooks/useCategories'
import { navigate } from '@/lib/router'

const itemClass = 'block w-full rounded-xl px-2 py-2.5 text-left font-medium transition-colors hover:bg-background/10'

export function MobileNav({
  query,
  onQueryChange,
  onNavigate,
  onCategory,
}: {
  query: string
  onQueryChange: (value: string) => void
  /** Closes the sheet after any navigation. */
  onNavigate: () => void
  onCategory: (slug: string) => void
}) {
  const categories = useCategories()

  const go = (path: string) => {
    onNavigate()
    navigate(path)
  }

  return (
    <nav className="flex h-full flex-col" aria-label="Mobile menu">
      {/* Logo — the sheet's own close (X) button sits on the right */}
      <div className="flex h-16 shrink-0 items-center px-4 pr-14">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            go('/')
          }}
          aria-label="Surokkha home"
        >
          <img src="/logo_2.png" alt="Surokkha" className="h-9 w-auto" />
        </a>
      </div>

      <div className="space-y-3 overflow-y-auto px-4 pb-3">
        <SearchInput value={query} onChange={onQueryChange} id="searchInputM" tone="inverted" />
        <ul className="flex flex-col">
          <li>
            <button type="button" className={itemClass} onClick={() => go('/')}>
              Home
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                className={itemClass}
                onClick={() => {
                  onNavigate()
                  onCategory(c.slug)
                }}
              >
                {c.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                onNavigate()
                // Footer (with the contact details) is on every page
                setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 150)
              }}
            >
              Contact
            </button>
          </li>
        </ul>
      </div>

      {/* Pinned to the bottom */}
      <div className="mt-auto border-t border-background/15 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => go('/account')}
          className="flex w-full items-center gap-3 rounded-full border border-background/30 px-5 py-3 font-semibold transition-colors hover:bg-background/10"
        >
          <User className="h-5 w-5" />
          My Account / Log in
        </button>
      </div>
    </nav>
  )
}
