import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Link2, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react'
import { blogPath } from '@/lib/router'
import { POSTS, type BlogPost as Post } from '@/components/blog/blogData'
import { BlogLayout } from '@/components/blog/BlogLayout'
import { BlogCover, BlogCta, BlogLink, PostCard } from '@/components/blog/blogUi'
import { blogUrl, bnNum, DEFAULT_FILTERS, formatDate, getCategory, getPost, getTag, processBody, relatedPosts, whatsappLink } from '@/components/blog/blogUtils'

const shareBtn = 'grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary hover:text-primary'

export function BlogPost({ slug }: { slug: string }) {
  const post = getPost(slug)
  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 sm:pt-10">
      <BlogLayout filters={DEFAULT_FILTERS} highlightCat={post?.cat}>
        {post ? (
          <Article key={post.slug} post={post} />
        ) : (
          <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-2xl font-bold">লেখাটি খুঁজে পাওয়া যায়নি</p>
            <p className="mt-2 text-muted-foreground">লিংকটি ভুল হতে পারে বা লেখাটি সরানো হয়েছে।</p>
            <BlogLink href={blogPath()} className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">
              সব লেখা দেখুন
            </BlogLink>
          </div>
        )}
      </BlogLayout>
    </div>
  )
}

function Article({ post }: { post: Post }) {
  const cat = getCategory(post.cat)
  const { toc, before, after } = useMemo(() => processBody(post.body), [post])
  const related = useMemo(() => relatedPosts(post), [post])
  const sorted = useMemo(() => [...POSTS].sort((a, b) => b.date.localeCompare(a.date)), [])
  const idx = sorted.indexOf(post)
  const prev = sorted[idx + 1]
  const next = sorted[idx - 1]
  const url = typeof window !== 'undefined' ? window.location.href.split('#')[0] : ''

  const articleRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fbKey = `blog-feedback-${post.slug}`
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(() => {
    try {
      const v = localStorage.getItem(fbKey)
      return v === 'yes' || v === 'no' ? v : null
    } catch {
      return null
    }
  })

  // Title, description and Article structured data for this post (restored when leaving)
  useEffect(() => {
    const prevTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = meta?.content
    document.title = `${post.title} | সুরক্ষা ব্লগ`
    if (meta) meta.content = post.excerpt
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      inLanguage: 'bn',
      author: { '@type': 'Organization', name: 'সুরক্ষা টিম' },
      publisher: { '@type': 'Organization', name: 'Surokkha' },
    })
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc !== undefined) meta.content = prevDesc
      ld.remove()
    }
  }, [post])

  // Reading progress bar and the table-of-contents highlight
  useEffect(() => {
    const onScroll = () => {
      const a = articleRef.current
      if (!a) return
      const r = a.getBoundingClientRect()
      const pct = Math.min(100, Math.max(0, ((-r.top + window.innerHeight * 0.4) / r.height) * 100))
      if (barRef.current) barRef.current.style.width = `${pct}%`
      let cur: string | null = null
      for (const t of toc) {
        const h = document.getElementById(t.id)
        if (h && h.getBoundingClientRect().top < 140) cur = t.id
      }
      setActiveId(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  const copyLink = async () => {
    try {
      if (navigator.share && window.matchMedia('(pointer:coarse)').matches) await navigator.share({ title: post.title, url })
      else await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* the reader cancelled the share sheet */
    }
  }

  const vote = (v: 'yes' | 'no') => {
    setFeedback(v)
    try {
      localStorage.setItem(fbKey, v)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1">
        <div ref={barRef} className="h-full w-0 bg-primary transition-[width] duration-100" />
      </div>

      <article ref={articleRef} className="mx-auto max-w-3xl">
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <BlogLink href={blogPath()} className="hover:text-primary">
            ব্লগ
          </BlogLink>
          <span aria-hidden="true">/</span>
          <BlogLink href={blogUrl({ cat: post.cat })} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent/70">
            {cat.name}
          </BlogLink>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-extrabold leading-snug sm:text-4xl sm:leading-snug md:text-[2.6rem] md:leading-tight">{post.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border py-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent font-display text-lg font-extrabold text-primary">সু</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-semibold">সুরক্ষা টিম</p>
            <p className="text-sm text-muted-foreground">
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {bnNum(post.read)} মিনিট পড়া
            </p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="শেয়ার করুন">
            <a className={shareBtn} aria-label="WhatsApp-এ শেয়ার" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}>
              <MessageCircle className="h-5 w-5" />
            </a>
            <a className={shareBtn} aria-label="Facebook-এ শেয়ার" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
              <span className="font-display text-lg font-extrabold leading-none">f</span>
            </a>
            <button type="button" className={shareBtn} aria-label={copied ? 'কপি হয়েছে' : 'লিংক কপি করুন'} onClick={copyLink}>
              {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <figure className="mt-6 overflow-hidden rounded-3xl shadow-sm">
          <BlogCover post={post} className="aspect-[16/8]" />
        </figure>

        {toc.length > 1 && (
          <details className="group mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold">
              এই লেখায় কী আছে
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <ol className="mt-3 space-y-1 text-[0.95rem]">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`blog-toc-link ${activeId === t.id ? 'is-on' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    {t.text}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* Article body is trusted, static content from blogData */}
        <div className="prose-blog mt-8" dangerouslySetInnerHTML={{ __html: before }} />
        {(after || toc.length >= 2) && <BlogCta variant="inline" context={post.title} />}
        {after && <div className="prose-blog" dangerouslySetInnerHTML={{ __html: after }} />}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="font-semibold">লেখাটি কি কাজে লেগেছে?</p>
          <div className="flex gap-2">
            {([['yes', 'হ্যাঁ', ThumbsUp], ['no', 'না', ThumbsDown]] as const).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                disabled={feedback !== null}
                onClick={() => vote(v)}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 font-semibold transition-colors ${feedback === v ? 'border-primary text-primary' : 'border-border'} ${feedback === null ? 'hover:border-primary hover:text-primary' : ''}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {feedback && (
            <p className="w-full text-sm text-muted-foreground" role="status">
              {feedback === 'yes' ? (
                'ধন্যবাদ! আপনার মতামত আমাদের উৎসাহ দেয়।'
              ) : (
                <>
                  দুঃখিত! কী জানতে চান,{' '}
                  <a className="font-semibold text-primary underline" target="_blank" rel="noopener noreferrer" href={whatsappLink(`ব্লগ নিয়ে একটি প্রশ্ন ছিল: ${post.title}`)}>
                    WhatsApp-এ জিজ্ঞেস করুন
                  </a>
                  , আমরা সাহায্য করব।
                </>
              )}
            </p>
          )}
        </div>

        <div className="mt-10">
          <BlogCta variant="end" context={post.title} />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-muted-foreground">ট্যাগ:</span>
          {post.tags.map((t) => (
            <BlogLink key={t} href={blogUrl({ tags: [t] })} className="blog-tag-pill">
              #{getTag(t).name}
            </BlogLink>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {prev ? (
            <BlogLink href={blogPath(prev.slug)} className="group flex flex-1 flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">← আগের লেখা</span>
              <span className="line-clamp-2 font-display font-bold leading-snug group-hover:text-primary">{prev.title}</span>
            </BlogLink>
          ) : (
            <span className="hidden flex-1 sm:block" />
          )}
          {next && (
            <BlogLink href={blogPath(next.slug)} className="group flex flex-1 flex-col gap-1 rounded-2xl border border-border bg-card p-4 text-right transition-colors hover:border-primary sm:items-end">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">পরের লেখা →</span>
              <span className="line-clamp-2 font-display font-bold leading-snug group-hover:text-primary">{next.title}</span>
            </BlogLink>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">আরও পড়ুন</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {related.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
