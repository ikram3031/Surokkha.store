import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { BoxIcon, BottleIcon, ComboIcon } from '@/components/icons/ArtIcons'
import type { ShopFilter } from '@/components/shop/FilterBar'

const tiles: {
  cat: ShopFilter
  title: string
  desc: string
  bg: string
  icon: ReactNode
}[] = [
  {
    cat: 'condom',
    title: 'কনডম',
    desc: 'ক্লাসিক, আল্ট্রা থিন ও ফ্লেভারড',
    bg: 'bg-secondary hover:bg-muted',
    icon: <BoxIcon c1="#F4919F" c2="#C9475F" />,
  },
  {
    cat: 'lube',
    title: 'লুব্রিকেন্ট',
    desc: 'ওয়াটার ও সিলিকন বেসড',
    bg: 'bg-accent hover:bg-accent/80',
    icon: <BottleIcon c1="#F5E6D3" c2="#948B86" />,
  },
  {
    cat: 'combo',
    title: 'কম্বো প্যাক',
    desc: 'দুটো একসাথে, কম দামে',
    bg: 'bg-muted hover:bg-muted/70',
    icon: <ComboIcon />,
  },
]

export function Categories({ onSelect }: { onSelect: (cat: ShopFilter) => void }) {
  return (
    <section id="categories" className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="font-display text-3xl font-bold">কী খুঁজছেন?</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Card
            key={tile.cat}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(tile.cat)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(tile.cat)
            }}
            className={`flex cursor-pointer flex-row items-center gap-4 rounded-[2rem] border-none p-6 text-left shadow-none ${tile.bg}`}
          >
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-background p-3">
              {tile.icon}
            </span>
            <span>
              <span className="block font-display text-xl font-bold">{tile.title}</span>
              <span className="text-sm text-muted-foreground">{tile.desc}</span>
            </span>
          </Card>
        ))}
      </div>
    </section>
  )
}
