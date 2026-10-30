import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Menu, MessageCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { subscribe } from '@/lib/api/contact'
import { isValidEmail } from '@/lib/checkout'
import { navigate, blogPath } from '@/lib/router'
import { CATS, POSTS, TAGS, type BlogCategoryId } from '@/components/blog/blogData'
import { BlogLink, CATEGORY_ICONS } from '@/components/blog/blogUi'
import { blogUrl, bnNum, popularPosts, SHOP_PATH, whatsappLink, type BlogFilters } from '@/components/blog/blogUtils'

const sectionTitle = 'px-1 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'

/**
 * Archive filters: search, categories, tags, popular posts, shop CTA and newsletter.
 * Every filter is a real link (/blog?cat=...&tag=...), so the same sidebar works on the archive and on a single post.
 * `filters` builds the links; `highlightCat` lets a post page mark its own category without filtering by it.
 */
export function BlogSidebar({
  filters,
  highlightCat = filters.cat,
  live = false,
  onNavigate,
}: {
  filters: BlogFilters
  highlightCat?: BlogCategoryId | 'all'
  /** On the archive, typing filters instantly; elsewhere it only searches on submit. */
  live?: boolean
  /** Called after any link click, e.g. to close the mobile drawer. */
  onNavigate?: () => void
}) {
  const [q, setQ] = useState(filters.q)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // A filter reset elsewhere (chips, "clear all") clears the box too
  useEffect(() => setQ(filters.q), [filters.q])

  useEffect(() => {
    if (!live || q.trim() === filters.q) return
    const t = setTimeout(() => navigate(blogUrl({ ...filters, q: q.trim() }), { replace: true, scroll: false }), 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const scroll = !live
  const search = (e: FormEvent) => {
    e.preventDefault()
    navigate(blogUrl({ ...filters, q: q.trim() }), { scroll })
    onNavigate?.()
  }

  const join = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!isValidEmail(email)) return toast.error('সঠিক ইমেইল দিন')
    setBusy(true)
    try {
      await subscribe(email.trim().toLowerCase())
      setDone(true)
      setEmail('')
      toast.success('ধন্যবাদ! নতুন লেখা এলে জানিয়ে দেব।')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'এখন সাবস্ক্রাইব করা গেল না, একটু পরে আবার চেষ্টা করুন।')
    } finally {
      setBusy(false)
    }
  }

  const count = (id: BlogCategoryId | 'all') => POSTS.filter((p) => id === 'all' || p.cat === id).length
  const toggleTag = (id: string) => (filters.tags.includes(id as never) ? filters.tags.filter((t) => t !== id) : [...filters.tags, id as never])

  return (
    <div className="space-y-6">
      <form role="search" onSubmit={search}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="লেখা খুঁজুন..."
            aria-label="লেখা খুঁজুন"
            autoComplete="off"
            className="h-12 rounded-full bg-card pl-12 pr-4 text-base"
          />
        </div>
      </form>

      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className={sectionTitle}>ব্লগ ক্যাটাগরি</h2>
        <nav className="space-y-1" aria-label="ব্লগ ক্যাটাগরি">
          {[{ id: 'all' as const, name: 'সব লেখা', Icon: Menu }, ...CATS.map((c) => ({ id: c.id, name: c.name, Icon: CATEGORY_ICONS[c.icon] }))].map(({ id, name, Icon }) => (
            <BlogLink
              key={id}
              href={blogUrl({ ...filters, cat: id })}
              scroll={scroll}
              onClick={onNavigate}
              className="blog-cat-row"
              aria-current={highlightCat === id ? 'true' : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 opacity-80" />
                {name}
              </span>
              <small>{bnNum(count(id))}</small>
            </BlogLink>
          ))}
        </nav>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className={`${sectionTitle} pb-3`}>ট্যাগ</h2>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <BlogLink
              key={t.id}
              href={blogUrl({ ...filters, tags: toggleTag(t.id) })}
              scroll={scroll}
              onClick={onNavigate}
              className="blog-tag-pill"
              aria-pressed={filters.tags.includes(t.id)}
            >
              #{t.name}
              <span className="text-xs opacity-60">{bnNum(POSTS.filter((p) => p.tags.includes(t.id)).length)}</span>
            </BlogLink>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className={sectionTitle}>জনপ্রিয় লেখা</h2>
        <ol className="space-y-1">
          {popularPosts().map((p, i) => (
            <li key={p.slug}>
              <BlogLink href={blogPath(p.slug)} onClick={onNavigate} className="group flex gap-3 rounded-2xl p-2 transition-colors hover:bg-accent/50">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-extrabold text-primary">{bnNum(i + 1)}</span>
                <span className="line-clamp-2 text-[0.92rem] font-medium leading-snug group-hover:text-primary">{p.title}</span>
              </BlogLink>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground">
        <span className="blog-floaty pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <p className="relative text-xs font-semibold uppercase tracking-wider opacity-80">সুরক্ষা শপ</p>
        <p className="relative mt-1 font-display text-xl font-bold leading-snug">গোপন প্যাকেজিংয়ে, ক্যাশ অন ডেলিভারি</p>
        <BlogLink
          href={SHOP_PATH}
          onClick={onNavigate}
          className="relative mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-card font-bold text-primary transition-transform hover:scale-[1.03] active:scale-95"
        >
          পণ্য দেখুন <ArrowRight className="h-4 w-4" />
        </BlogLink>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-2 flex h-11 items-center justify-center gap-2 rounded-full border border-white/40 text-sm font-semibold transition-colors hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp-এ অর্ডার
        </a>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold">নতুন লেখার খবর পান</h2>
        <p className="mt-1 text-sm text-muted-foreground">ইমেইলে পাঠিয়ে দেব। কোনো স্প্যাম নয়।</p>
        <form onSubmit={join} noValidate className="mt-3 space-y-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল"
            aria-label="ইমেইল"
            autoComplete="email"
            className="h-11 rounded-full bg-background px-4"
          />
          <button
            type="submit"
            disabled={busy || done}
            className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {done ? 'সাবস্ক্রাইব হয়েছে' : busy ? '...' : 'সাবস্ক্রাইব'}
          </button>
        </form>
      </section>
    </div>
  )
}
