import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import { navigate, blogPath, useSearch } from '@/lib/router'
import { POSTS, CATS } from '@/components/blog/blogData'
import { BlogLayout } from '@/components/blog/BlogLayout'
import { BlogCover, BlogCta, BlogLink, PostCard } from '@/components/blog/blogUi'
import { blogUrl, bnNum, DEFAULT_FILTERS, filterPosts, formatDate, getCategory, getTag, parseFilters, type BlogSort } from '@/components/blog/blogUtils'

const PER_PAGE = 6

export function BlogArchive() {
  const search = useSearch()
  const filters = useMemo(() => parseFilters(search), [search])
  const [page, setPage] = useState(1)
  const resultsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = (filters.cat !== 'all' ? `${getCategory(filters.cat).name} | ` : '') + 'ব্লগ | সুরক্ষা'
  }, [filters.cat])

  // A new filter starts from page 1, and brings the results into view if the reader had scrolled past them
  useEffect(() => {
    setPage(1)
    const el = resultsRef.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [search])

  const list = useMemo(() => filterPosts(filters), [filters])
  const filtering = filters.cat !== 'all' || filters.tags.length > 0 || filters.q !== ''
  const featured = !filtering && filters.sort === 'new' ? POSTS.find((p) => p.featured) : undefined
  const rest = featured ? list.filter((p) => p !== featured) : list
  const shown = rest.slice(0, page * PER_PAGE)
  const left = rest.length - shown.length

  const update = (next: Partial<typeof filters>) => navigate(blogUrl({ ...filters, ...next }), { replace: true, scroll: false })
  const chips = [
    ...(filters.cat !== 'all' ? [{ key: 'cat', label: getCategory(filters.cat).name, clear: () => update({ cat: 'all' }) }] : []),
    ...filters.tags.map((t) => ({ key: `t-${t}`, label: `#${getTag(t).name}`, clear: () => update({ tags: filters.tags.filter((x) => x !== t) }) })),
    ...(filters.q ? [{ key: 'q', label: `“${filters.q}”`, clear: () => update({ q: '' }) }] : []),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 sm:pt-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-secondary px-5 py-8 sm:px-10 sm:py-12">
        <span className="blog-floaty pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-accent" />
        <span className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-ring/25" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">সুরক্ষা ব্লগ</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-snug sm:text-4xl md:text-5xl md:leading-tight">জানুন, বুঝুন, নিরাপদ থাকুন</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">যৌন স্বাস্থ্য ও নিরাপদ সম্পর্ক নিয়ে সহজ ভাষায় সঠিক তথ্য। কোনো লজ্জা নয়, কোনো ভুল ধারণা নয়।</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
            {[`${bnNum(POSTS.length)}টি লেখা`, `${bnNum(CATS.length)}টি ক্যাটাগরি`, 'চিকিৎসা-তথ্য ভিত্তিক'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick categories (mobile) */}
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden" aria-label="দ্রুত ক্যাটাগরি">
        {[{ id: 'all' as const, name: 'সব' }, ...CATS].map((c) => (
          <BlogLink key={c.id} href={blogUrl({ ...filters, cat: c.id })} scroll={false} className="blog-tag-pill shrink-0 !px-4 !py-2 !text-[0.95rem]" aria-pressed={filters.cat === c.id}>
            {c.name}
          </BlogLink>
        ))}
      </div>

      <div className="mt-8">
        <BlogLayout filters={filters} live>
          <section ref={resultsRef} className="scroll-mt-24" aria-label="ব্লগ লেখাসমূহ">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {list.length > 0 && `${bnNum(list.length)}টি লেখা`}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="blog-sort" className="hidden text-sm text-muted-foreground sm:block">
                  সাজান
                </label>
                <select
                  id="blog-sort"
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value as BlogSort })}
                  className="h-11 rounded-full border border-border bg-card px-4 text-sm font-medium outline-none focus:border-ring focus:ring-4 focus:ring-ring/30"
                >
                  <option value="new">নতুন আগে</option>
                  <option value="pop">জনপ্রিয় আগে</option>
                  <option value="short">ছোট লেখা আগে</option>
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <span key={c.key} className="blog-chip">
                    {c.label}
                    <button type="button" aria-label={`${c.label} সরান`} onClick={c.clear}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {chips.length > 1 && (
                  <button type="button" className="text-sm font-semibold text-primary underline underline-offset-4" onClick={() => update({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                    সব মুছুন
                  </button>
                )}
              </div>
            )}

            {featured && (
              <BlogLink href={blogPath(featured.slug)} className="blog-card blog-rise group mt-5 grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
                <BlogCover post={featured} className="aspect-[16/10] md:aspect-auto md:h-full md:min-h-[300px]" />
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">সম্পাদকের পছন্দ</span>
                  <h2 className="mt-4 font-display text-2xl font-extrabold leading-snug transition-colors group-hover:text-primary sm:text-3xl sm:leading-snug">{featured.title}</h2>
                  <p className="mt-3 line-clamp-3 leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{getCategory(featured.cat).name}</span>
                    <span>·</span>
                    <span>{formatDate(featured.date)}</span>
                    <span>·</span>
                    <span>{bnNum(featured.read)} মিনিট পড়া</span>
                  </div>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-all group-hover:gap-3">
                    লেখাটি পড়ুন <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </BlogLink>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {shown.map((p, i) => (
                <Fragment key={p.slug}>
                  <PostCard post={p} index={i} />
                  {/* A conversion block after the 4th card */}
                  {i === 3 && (
                    <div className="blog-rise sm:col-span-2 2xl:col-span-3">
                      <BlogCta variant="inline" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {list.length === 0 && (
              <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                <p className="font-display text-xl font-bold">কোনো লেখা পাওয়া যায়নি</p>
                <p className="mt-2 text-muted-foreground">অন্য কোনো শব্দ, ক্যাটাগরি বা ট্যাগ দিয়ে চেষ্টা করুন।</p>
                <button type="button" className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground" onClick={() => navigate(blogPath(), { replace: true, scroll: false })}>
                  সব ফিল্টার মুছুন
                </button>
              </div>
            )}

            {left > 0 && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setPage((n) => n + 1)}
                  className="inline-flex h-12 items-center rounded-full border border-border bg-card px-8 font-semibold transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  আরও লেখা দেখান ({bnNum(left)}টি বাকি)
                </button>
              </div>
            )}
          </section>
        </BlogLayout>
      </div>

      <div className="mt-16">
        <BlogCta variant="end" />
      </div>
    </div>
  )
}
