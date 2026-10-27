import { useState } from 'react'
import { Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SearchInput } from '@/components/header/SearchInput'
import { CartButton } from '@/components/header/CartButton'
import { MobileNav } from '@/components/header/MobileNav'
import { navigate } from '@/lib/router'

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
    <header className="sticky top-0 z-40 border-b border-background/10 bg-foreground text-background">
      {/* বামে মেনু আইকন + সার্চ, মাঝে লোগো, ডানে অ্যাকাউন্ট ও কার্ট */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-background/10 hover:text-background" aria-label="মেনু খুলুন">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="max-w-xs border-none bg-foreground text-background [&_svg]:text-background"
            >
              <SheetTitle className="sr-only">মেনু</SheetTitle>
              <MobileNav query={query} onQueryChange={onQueryChange} onNavigate={() => setMenuOpen(false)} onCategory={onCategory} />
            </SheetContent>
          </Sheet>

          {/* ছোট মোবাইলে জায়গা কম, সার্চ তখন মেনুর ভেতরে */}
          <SearchInput
            value={query}
            onChange={onQueryChange}
            className="hidden w-full max-w-64 sm:block"
            id="searchInput"
          />
        </div>

        <a href="/" className="flex items-center justify-center" aria-label="সুরক্ষা হোমপেজ">
          <img src="/logo_2.png" alt="সুরক্ষা" className="h-10 w-auto" />
        </a>

        <div className="flex items-center justify-end gap-2">
          <Button size="icon" className="hidden rounded-full bg-background text-foreground hover:bg-background/90 sm:inline-flex" aria-label="আমার অ্যাকাউন্ট" onClick={() => navigate('/account')}>
            <User className="h-5 w-5" />
          </Button>
          <CartButton onClick={onCartOpen} />
        </div>
      </div>
    </header>
  )
}
