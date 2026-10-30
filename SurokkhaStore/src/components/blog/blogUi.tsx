import type { ComponentProps, MouseEvent } from 'react'
import { ArrowRight, Check, CircleHelp, Clock, Heart, Lightbulb, MessageCircle, Package, ShieldCheck, type LucideIcon } from 'lucide-react'
import { navigate, blogPath } from '@/lib/router'
import type { BlogCategory, BlogPost } from '@/components/blog/blogData'
import { bnNum, formatDate, getCategory, SHOP_PATH, whatsappLink } from '@/components/blog/blogUtils'

export const CATEGORY_ICONS: Record<BlogCategory['icon'], LucideIcon> = {
  heart: Heart,
  shield: ShieldCheck,
  bulb: Lightbulb,
  help: CircleHelp,
  box: Package,
}

/** In-app link: client-side navigation for plain clicks, normal browser behaviour for new-tab clicks. */
export function BlogLink({ href, onClick, scroll = true, ...props }: ComponentProps<'a'> & { href: string; scroll?: boolean }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target === '_blank') return
    e.preventDefault()
    navigate(href, { scroll })
  }
  return <a href={href} onClick={handle} {...props} />
}

const GRADIENTS: [string, string][] = [
  ['#fbd6db', '#f4919f'],
  ['#f5e6d3', '#eab9a4'],
  ['#6b1d37', '#c9475f'],
  ['#fbf5ec', '#f4b6bf'],
  ['#4d1224', '#8a2b46'],
  ['#ebd5ba', '#f4919f'],
  ['#f4919f', '#c9475f'],
  ['#fbd6db', '#ebd5ba'],
]

/** Brand-gradient cover with the category icon; a real image (post.image) replaces the icon when set. */
export function BlogCover({ post, className = 'aspect-[16/10]' }: { post: BlogPost; className?: string }) {
  const [from, to] = GRADIENTS[post.g % GRADIENTS.length]
  const Icon = CATEGORY_ICONS[getCategory(post.cat).icon]
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: post.tone === 'dark' ? '#fbf5ec' : '#4d1224' }}
    >
      <div className="blog-cover-inner absolute inset-0">
        <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <span className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/15" />
        <span className="absolute bottom-6 right-10 h-10 w-10 rounded-full bg-white/20" />
        {post.image ? (
          <img src={post.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute left-1/2 top-1/2 grid aspect-square h-[34%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 backdrop-blur-sm">
            <Icon className="h-1/2 w-1/2" strokeWidth={1.8} />
          </span>
        )}
      </div>
    </div>
  )
}

export function PostCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const cat = getCategory(post.cat)
  return (
    <BlogLink
      href={blogPath(post.slug)}
      className="blog-card blog-rise group flex flex-col overflow-hidden rounded-3xl border border-border bg-card"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <BlogCover post={post} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">{cat.name}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {bnNum(post.read)} মিনিট
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug transition-colors group-hover:text-primary">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="text-muted-foreground">{formatDate(post.date)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            পড়ুন <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </BlogLink>
  )
}

const BENEFITS = ['গোপন প্যাকেজিং', 'ক্যাশ অন ডেলিভারি', 'bKash / Nagad পেমেন্ট', 'WhatsApp-এ সরাসরি সাহায্য']

/** Conversion blocks: "inline" sits mid-article, "end" closes the page. */
export function BlogCta({ variant = 'end', context }: { variant?: 'inline' | 'end'; context?: string }) {
  const wa = whatsappLink(context ? `আসসালামু আলাইকুম, "${context}" লেখাটা পড়ে অর্ডার করতে চাই।` : undefined)

  if (variant === 'inline') {
    return (
      <aside className="my-10 rounded-3xl border border-ring/60 bg-accent/60 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">সুরক্ষা শপ</p>
            <p className="mt-1 font-display text-xl font-bold leading-snug">নিরাপদ থাকতে ঠিক পণ্যটা হাতের কাছে রাখুন</p>
            <p className="mt-1 text-sm text-muted-foreground">গোপন প্যাকেজিংয়ে ঘরে বসে অর্ডার, ক্যাশ অন ডেলিভারি।</p>
          </div>
          <BlogLink
            href={SHOP_PATH}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
          >
            পণ্য দেখুন <ArrowRight className="h-4 w-4" />
          </BlogLink>
        </div>
      </aside>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
      <span className="blog-floaty pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-white/10" />
      <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider opacity-80">আজই নিশ্চিন্ত হন</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-snug sm:text-3xl">সুরক্ষা থাকুক সবসময়, ঘরে বসেই</h2>
          <ul className="mt-4 grid gap-2 text-[0.95rem] sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <BlogLink
            href={SHOP_PATH}
            className="blog-pulse-ring inline-flex h-14 items-center justify-center gap-2 rounded-full bg-card text-lg font-bold text-primary transition-transform hover:scale-[1.03] active:scale-95"
          >
            এখনই অর্ডার করুন <ArrowRight className="h-5 w-5" />
          </BlogLink>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 font-semibold transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp-এ জিজ্ঞেস করুন
          </a>
          <p className="text-center text-xs opacity-75">প্রতিদিন সকাল ১০টা থেকে রাত ১০টা</p>
        </div>
      </div>
    </section>
  )
}
