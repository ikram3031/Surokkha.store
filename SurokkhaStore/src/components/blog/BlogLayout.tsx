import { useEffect, useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { BlogLink } from '@/components/blog/blogUi'
import { bnNum, SHOP_PATH, type BlogFilters } from '@/components/blog/blogUtils'
import type { BlogCategoryId } from '@/components/blog/blogData'

const ORDER_BAR_DISMISSED = 'blog-order-bar-dismissed'

/** Mobile-only order bar that appears after scrolling. It leaves room on the right for the WhatsApp button. */
function StickyOrderBar() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(ORDER_BAR_DISMISSED) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed) return null
  return (
    <div
      className={`fixed bottom-4 left-3 right-20 z-30 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-2xl shadow-primary/30 backdrop-blur transition-transform duration-300 lg:hidden ${visible ? 'translate-y-0' : 'translate-y-[140%]'}`}
    >
      <BlogLink href={SHOP_PATH} className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
        এখনই অর্ডার করুন
      </BlogLink>
      <button
        type="button"
        aria-label="বন্ধ করুন"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
        onClick={() => {
          setDismissed(true)
          try {
            sessionStorage.setItem(ORDER_BAR_DISMISSED, '1')
          } catch {
            /* private mode: the bar just comes back on the next page */
          }
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Sidebar on the left (sticky on desktop, a slide-in drawer on mobile) and the page content on the right. */
export function BlogLayout({
  filters,
  highlightCat,
  live,
  children,
}: {
  filters: BlogFilters
  highlightCat?: BlogCategoryId | 'all'
  live?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const active = (filters.cat !== 'all' ? 1 : 0) + filters.tags.length + (filters.q ? 1 : 0)

  return (
    <div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
      <aside className="no-scrollbar hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1" aria-label="ক্যাটাগরি ও ট্যাগ">
        <BlogSidebar filters={filters} highlightCat={highlightCat} live={live} />
      </aside>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-md shadow-primary/25 lg:hidden"
        >
          <Menu className="h-5 w-5" /> ক্যাটাগরি ও ট্যাগ
          {active > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-card px-1.5 text-xs font-bold text-primary">{bnNum(active)}</span>}
        </button>
        {children}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[88%] max-w-sm gap-0 overflow-y-auto p-5 pt-14">
          <SheetTitle className="sr-only">ক্যাটাগরি ও ট্যাগ</SheetTitle>
          <BlogSidebar filters={filters} highlightCat={highlightCat} live={live} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <StickyOrderBar />
    </div>
  )
}
