import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SearchInput } from '@/components/header/SearchInput'
import { CartButton } from '@/components/header/CartButton'
import { MobileNav } from '@/components/header/MobileNav'

const links = [
  { href: '#shop', label: 'সব পণ্য' },
  { href: '#categories', label: 'ক্যাটাগরি' },
  { href: '#why', label: 'কেন সুরক্ষা' },
  { href: '#faq', label: 'প্রশ্নোত্তর' },
]

export function Header({
  query,
  onQueryChange,
  onCartOpen,
}: {
  query: string
  onQueryChange: (value: string) => void
  onCartOpen: () => void
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="মেনু খুলুন">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="max-w-xs border-none bg-foreground text-background [&_svg]:text-background"
          >
            <SheetTitle className="sr-only">মেনু</SheetTitle>
            <MobileNavWrapper query={query} onQueryChange={onQueryChange} />
          </SheetContent>
        </Sheet>

        <a href="#" className="flex items-center gap-2" aria-label="সুরক্ষা হোমপেজ">
          <img src="/logo.png" alt="সুরক্ষা" className="h-10 w-auto" />
        </a>

        <nav className="ml-6 hidden items-center gap-6 font-medium md:flex" aria-label="প্রধান মেনু">
          {links.map((l) => (
            <a key={l.href} className="hover:text-primary" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            className="hidden w-52 sm:block"
            id="searchInput"
          />
          <CartButton onClick={onCartOpen} />
        </div>
      </div>
    </header>
  )
}

function MobileNavWrapper({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
}) {
  return <MobileNav query={query} onQueryChange={onQueryChange} onNavigate={() => {}} />
}
