import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SearchInput } from '@/components/header/SearchInput'
import { CartButton } from '@/components/header/CartButton'
import { MobileNav } from '@/components/header/MobileNav'
import { AccountMenu } from '@/components/header/AccountMenu'

export function Header({
  query,
  onQueryChange,
  onCartOpen,
  onCategory,
}: {
  query: string
  onQueryChange: (value: string) => void
  onCartOpen: () => void
  onCategory: (slug: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="dark sticky top-0 z-40 border-b border-border bg-background text-white">
      {/* Left: menu icon + search, centre: logo, right: account and cart */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white" aria-label="Open menu">
                {/* Font Awesome "bars" (fa-solid fa-bars) */}
                <svg viewBox="0 0 448 512" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="max-w-xs border-none bg-background text-white [&_svg]:text-white"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <MobileNav onNavigate={() => setMenuOpen(false)} onCategory={onCategory} />
            </SheetContent>
          </Sheet>

          {/* Not enough room on small phones, where search lives inside the menu */}
          <SearchInput
            value={query}
            onChange={onQueryChange}
            tone="inverted"
            className="hidden w-full max-w-64 sm:block"
            id="searchInput"
          />
        </div>

        <a href="/" className="flex items-center justify-center" aria-label="Surokkha home">
          <img src="/surokkha_store_logo_dark.png" alt="Surokkha Store" className="h-10 w-auto" />
        </a>

        <div className="flex items-center justify-end gap-2">
          {/* Profile icon is hidden on mobile — the account link lives in the side menu there */}
          <div className="hidden md:flex">
            <AccountMenu />
          </div>
          <CartButton onClick={onCartOpen} />
        </div>
      </div>
    </header>
  )
}
