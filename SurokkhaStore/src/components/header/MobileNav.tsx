import { SearchInput } from '@/components/header/SearchInput'

const links = [
  { href: '/#shop', label: 'সব পণ্য' },
  { href: '/#categories', label: 'ক্যাটাগরি' },
  { href: '/#why', label: 'কেন সুরক্ষা' },
  { href: '/#faq', label: 'প্রশ্নোত্তর' },
]

export function MobileNav({
  query,
  onQueryChange,
  onNavigate,
}: {
  query: string
  onQueryChange: (value: string) => void
  onNavigate: () => void
}) {
  return (
    <nav className="flex flex-col gap-3 px-4 py-3" aria-label="মোবাইল মেনু">
      <SearchInput value={query} onChange={onQueryChange} id="searchInputM" tone="inverted" />
      <div className="flex flex-col font-medium">
        {links.map((l) => (
          <a key={l.href} className="py-2" href={l.href} onClick={onNavigate}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
