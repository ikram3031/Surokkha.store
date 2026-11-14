import type { ReactNode } from 'react'
import { Flower2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BoxIcon, BottleIcon, ComboIcon } from '@/components/icons/ArtIcons'
import type { ShopFilter } from '@/components/shop/FilterBar'
import { SectionBackground } from '@/components/SectionBackground'
import { SectionHeading } from '@/components/SectionHeading'
import { L } from '@/lib/i18n'

const tiles: {
  cat: ShopFilter
  title: string
  desc: string
  bg: string
  icon: ReactNode
}[] = [
  {
    cat: 'condoms',
    title: L('Condoms', 'কনডম'),
    desc: L('Classic, ultra thin and flavoured', 'ক্লাসিক, আল্ট্রা থিন ও ফ্লেভার্ড'),
    bg: 'bg-secondary hover:bg-muted',
    icon: <BoxIcon c1="#F4919F" c2="#C9475F" />,
  },
  {
    cat: 'lubricants',
    title: L('Lubricants', 'লুব্রিকেন্ট'),
    desc: L('Water and silicone based', 'পানি ও সিলিকন-ভিত্তিক'),
    bg: 'bg-accent hover:bg-accent/80',
    icon: <BottleIcon c1="#F5E6D3" c2="#948B86" />,
  },
  {
    cat: 'combo',
    title: L('Combo Packs', 'কম্বো প্যাক'),
    desc: L('Better together, for less', 'একসাথে নিন, কম দামে'),
    bg: 'bg-muted hover:bg-muted/70',
    icon: <ComboIcon />,
  },
  {
    cat: 'feminine-care',
    title: L('Feminine Care', 'ফেমিনিন কেয়ার'),
    desc: L('Personal care & hygiene', 'ব্যক্তিগত যত্ন ও স্বাস্থ্যবিধি'),
    bg: 'bg-secondary hover:bg-muted',
    icon: <Flower2 className="h-full w-full text-primary" strokeWidth={1.5} />,
  },
]

export function Categories({ onSelect }: { onSelect: (cat: ShopFilter) => void }) {
  return (
    <section id="categories" className="relative overflow-hidden">
      <SectionBackground name="categories" />
      <div className="relative mx-auto max-w-7xl px-4 py-14">
      <SectionHeading align="center" title={L('What are you looking for?', 'আপনি কী খুঁজছেন?')} />
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
