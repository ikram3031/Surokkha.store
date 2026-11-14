import { SectionBackground } from '@/components/SectionBackground'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { categoryPath, navigate } from '@/lib/router'
import { SectionHeading } from '@/components/SectionHeading'
import { L } from '@/lib/i18n'

// Which categories lead the mosaic, in this order; anything else from the API fills the gaps
const PREFERRED = ['condoms', 'lubricants', 'feminine-care', 'combo', 'wellness']

// Three equal columns filled top to bottom: the first tile is tall, then two stacked tiles in each other column
// On mobile: two columns, the first tile full width on top
const SPANS = ['col-span-2 md:col-span-1 md:row-span-2', '', '', '', '']

// Generated mood photos (dark slate + maroon silk, no brand packs) for the main categories;
// others fall back to a product photo
const TILE_IMAGES: Record<string, string> = {
  condoms: '/categories/condoms-ai.webp',
  lubricants: '/categories/lubricants-ai.webp',
  'feminine-care': '/categories/feminine-care-ai.webp',
  combo: '/categories/combo-ai.webp',
  wellness: '/categories/wellness-ai.webp',
}

/** "Shop by need": a mosaic of category tiles, each using the photo of a product from that category. */
export function ShopByNeed() {
  const categories = useCategories()
  const { products } = useProducts()

  const ordered = [
    ...PREFERRED.map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => !!c),
    ...categories.filter((c) => !PREFERRED.includes(c.slug)),
  ].slice(0, 5)

  if (ordered.length < 2) return null

  const imageFor = (slug: string) =>
    TILE_IMAGES[slug] ?? products.find((p) => p.categorySlugs?.includes(slug) && p.image)?.image

  return (
    <section id="categories" className="relative overflow-hidden">
      <SectionBackground name="categories" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        <SectionHeading title={L('Shop by need', 'প্রয়োজন অনুযায়ী কিনুন')} subtitle={L('Pick the category you came for — every tile opens its full range.', 'আপনার দরকারি ক্যাটাগরি বেছে নিন — প্রতিটিতে পুরো কালেকশন দেখতে পাবেন।')} />

        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:h-[560px] md:gap-5 md:grid-flow-col md:grid-cols-3 md:grid-rows-2">
          {ordered.map((category, i) => {
            const image = imageFor(category.slug)
            return (
              <a
                key={category.slug}
                href={categoryPath(category.slug)}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(categoryPath(category.slug))
                }}
                className={`group relative min-h-[150px] overflow-hidden rounded-xl md:min-h-[240px] md:rounded-2xl bg-secondary ring-1 ring-border ${SPANS[i] ?? ''} ${i === 0 ? 'min-h-[180px] md:min-h-[320px]' : ''}`}
              >
                {image && (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {/* Dark at the bottom, fading out towards the middle, so the label reads on any photo */}
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/45 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-3 bottom-3 flex items-center gap-2 text-xs font-semibold tracking-[0.15em] md:inset-x-5 md:bottom-5 md:gap-3 md:tracking-[0.25em] text-white uppercase md:text-base">
                  {category.label}
                  <span className="hidden h-px w-8 bg-primary sm:block transition-all duration-500 group-hover:w-16" aria-hidden="true" />
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
