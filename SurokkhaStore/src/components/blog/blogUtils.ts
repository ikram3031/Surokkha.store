import { CATS, POSTS, TAGS, type BlogCategory, type BlogCategoryId, type BlogPost, type BlogTag, type BlogTagId } from '@/components/blog/blogData'
import { blogPath } from '@/lib/router'

export const WHATSAPP_NUMBER = '8801600905774'
/** In launch mode the offer page is the shop. */
export const SHOP_PATH = '/offer'

export type BlogSort = 'new' | 'pop' | 'short'

export interface BlogFilters {
  cat: BlogCategoryId | 'all'
  tags: BlogTagId[]
  q: string
  sort: BlogSort
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

/** The blog is written in Bangla, so numbers and dates are shown with Bangla digits. */
export const bnNum = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)])

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${bnNum(d)} ${BN_MONTHS[m - 1]} ${bnNum(y)}`
}

export const whatsappLink = (text = 'আসসালামু আলাইকুম, আমি সুরক্ষা থেকে অর্ডার করতে চাই।') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

export const getCategory = (id: BlogCategoryId): BlogCategory => CATS.find((c) => c.id === id)!
export const getTag = (id: BlogTagId): BlogTag => TAGS.find((t) => t.id === id)!
export const getPost = (slug: string): BlogPost | undefined => POSTS.find((p) => p.slug === slug)

export const DEFAULT_FILTERS: BlogFilters = { cat: 'all', tags: [], q: '', sort: 'new' }

/** Filters live in the URL (/blog?cat=tips&tag=condom,size&q=...), so any view can be linked or reloaded. */
export function parseFilters(search: string): BlogFilters {
  const p = new URLSearchParams(search)
  const cat = p.get('cat')
  const sort = p.get('sort')
  return {
    cat: CATS.some((c) => c.id === cat) ? (cat as BlogCategoryId) : 'all',
    tags: (p.get('tag') ?? '').split(',').filter((t): t is BlogTagId => TAGS.some((x) => x.id === t)),
    q: (p.get('q') ?? '').trim(),
    sort: sort === 'pop' || sort === 'short' ? sort : 'new',
  }
}

export function blogUrl(f: Partial<BlogFilters> = {}) {
  const m = { ...DEFAULT_FILTERS, ...f }
  const p = new URLSearchParams()
  if (m.cat !== 'all') p.set('cat', m.cat)
  if (m.tags.length) p.set('tag', m.tags.join(','))
  if (m.q) p.set('q', m.q)
  if (m.sort !== 'new') p.set('sort', m.sort)
  const s = p.toString()
  return blogPath() + (s ? `?${s}` : '')
}

const SORTERS: Record<BlogSort, (a: BlogPost, b: BlogPost) => number> = {
  new: (a, b) => b.date.localeCompare(a.date),
  pop: (a, b) => b.pop - a.pop,
  short: (a, b) => a.read - b.read,
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const haystack = (p: BlogPost) => normalize([p.title, p.excerpt, getCategory(p.cat).name, ...p.tags.map((t) => getTag(t).name)].join(' '))

export function filterPosts(f: BlogFilters): BlogPost[] {
  const q = normalize(f.q)
  return POSTS.filter(
    (p) =>
      (f.cat === 'all' || p.cat === f.cat) &&
      (!f.tags.length || p.tags.some((t) => f.tags.includes(t))) &&
      (!q || haystack(p).includes(q)),
  ).sort(SORTERS[f.sort])
}

export const popularPosts = (n = 4) => [...POSTS].sort((a, b) => b.pop - a.pop).slice(0, n)

/** Same category and shared tags first, then popularity. */
export function relatedPosts(p: BlogPost, n = 3): BlogPost[] {
  return POSTS.filter((x) => x !== p)
    .map((x) => ({ x, s: (x.cat === p.cat ? 2 : 0) + x.tags.filter((t) => p.tags.includes(t)).length }))
    .sort((a, b) => b.s - a.s || b.x.pop - a.x.pop)
    .slice(0, n)
    .map((o) => o.x)
}

/** Gives every h2 an id (s1, s2, ...), builds the table of contents, and splits the body before the 3rd h2 for the in-article CTA. */
export function processBody(html: string) {
  let i = 0
  const toc: { id: string; text: string }[] = []
  const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    i += 1
    toc.push({ id: `s${i}`, text: inner.replace(/<[^>]+>/g, '') })
    return `<h2 id="s${i}">${inner}</h2>`
  })
  const third = withIds.indexOf('<h2 id="s3"')
  return third > 0
    ? { toc, before: withIds.slice(0, third), after: withIds.slice(third) }
    : { toc, before: withIds, after: '' }
}
