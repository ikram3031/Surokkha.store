import { SectionBackground } from '@/components/SectionBackground'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { categoryPath, navigate } from '@/lib/router'

// Which categories lead the mosaic, in this order; anything else from the API fills the gaps
const PREFERRED = ['condoms', 'lubricants', 'combo', 'feminine-care']

// Row/column spans for the four tiles of the mosaic (desktop)
const SPANS = ['md:row-span-2', '', 'md:row-span-2', '']

/** "Shop by need": a mosaic of category tiles, each using the photo of a product from that category. */
export function ShopByNeed() {
  const categories = useCategories()
  const { products } = useProducts()

  const ordered = [
    ...PREFERRED.map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => !!c),
    ...categories.filter((c) => !PREFERRED.includes(c.slug)),
  ].slice(0, 4)

  if (ordered.length < 2) return null

  const imageFor = (slug: string) => products.find((p) => p.categorySlugs?.includes(slug) && p.image)?.image

  return (
    <section id="categories" className="relative overflow-hidden">
      <SectionBackground name="categories" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Shop by need</h2>

        <div className="mt-10 grid gap-5 md:h-[560px] md:grid-cols-[1.6fr_0.75fr_0.75fr] md:grid-rows-2">
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
                className={`group relative min-h-[240px] overflow-hidden rounded-2xl bg-secondary ring-1 ring-border ${SPANS[i] ?? ''} ${i === 0 ? 'min-h-[320px]' : ''}`}
              >
                {image && (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <span className="absolute bottom-5 left-5 rounded bg-card px-4 py-2 text-sm font-semibold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {category.label}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
