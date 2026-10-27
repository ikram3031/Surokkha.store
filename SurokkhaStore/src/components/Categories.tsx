import type { ReactNode } from 'react'
import { Flower2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BoxIcon, BottleIcon, ComboIcon } from '@/components/icons/ArtIcons'
import type { ShopFilter } from '@/components/shop/FilterBar'
import { SectionBackground } from '@/components/SectionBackground'

const tiles: {
  cat: ShopFilter
  title: string
  desc: string
  bg: string
  icon: ReactNode
}[] = [
  {
    cat: 'condoms',
    title: 'কনডম',
    desc: 'ক্লাসিক, আল্ট্রা থিন ও ফ্লেভারড',
    bg: 'bg-secondary hover:bg-muted',
    icon: <BoxIcon c1="#F4919F" c2="#C9475F" />,
  },
  {
    cat: 'lubricants',
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
  {
    cat: 'feminine-care',
    title: 'ফেমিনিন কেয়ার',
    desc: 'ব্যক্তিগত যত্ন ও হাইজিন',
    bg: 'bg-secondary hover:bg-muted',
    icon: <Flower2 className="h-full w-full text-primary" strokeWidth={1.5} />,
  },
]

export function Categories({ onSelect }: { onSelect: (cat: ShopFilter) => void }) {
  return (
    <section id="categories" className="relative overflow-hidden">
      <SectionBackground name="categories" />
      <div className="relative mx-auto max-w-7xl px-4 py-14">
      <h2 className="text-center font-display text-3xl font-bold">কী খুঁজছেন?</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card
            key={tile.cat}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(tile.cat)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(tile.cat)
            }}
            className={`flex cursor-pointer flex-row items-center gap-4 rounded-[2rem] border-none p-5 text-left shadow-none ${tile.bg}`}
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-background p-3 lg:h-[4.5rem] lg:w-[4.5rem]">
              {tile.icon}
            </span>
            <span>
              <span className="block font-display text-xl font-bold">{tile.title}</span>
              <span className="text-sm text-muted-foreground">{tile.desc}</span>
            </span>
          </Card>
        ))}
      </div>
      </div>
    </section>
  )
}
