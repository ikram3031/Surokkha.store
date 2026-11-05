import { User } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { navigate } from '@/lib/router'

const itemClass = 'block w-full rounded-xl px-2 py-2.5 text-left font-medium transition-colors hover:bg-white/10'

export function MobileNav({
  onNavigate,
  onCategory,
}: {
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
            <button type="button" className={itemClass} onClick={() => go('/blog')}>
              Blog
            </button>
          </li>
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
      <div className="mt-auto border-t border-white/15 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => go('/account')}
          className="flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left transition-colors hover:bg-white/20"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
            <User className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight">My Account</span>
            <span className="block text-xs leading-tight text-white/70">Log in or sign up</span>
          </span>
        </button>
      </div>
    </nav>
  )
}
