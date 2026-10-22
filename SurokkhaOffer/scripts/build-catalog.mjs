// Builds public/catalog.csv (Meta Commerce Manager feed) from src/data/offer-products.json.
// Runs before every build, so the live feed at https://offer.surokkha.shop/catalog.csv always matches the page.
// Item ids match the ids the Meta Pixel sends (option id like SC01P001-10, or combo id like SC01C001),
// which is what lets catalog ads and retargeting connect pixel events to products.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://offer.surokkha.shop'
const BRAND = 'Surokkha'

const content = JSON.parse(readFileSync(join(root, 'src/data/offer-products.json'), 'utf8'))

const csvCell = (v) => {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').trim()
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const describe = (p) => [p.desc, ...(p.details ?? [])].filter(Boolean).join(' · ') || p.name

const rows = []
const add = ({ id, title, description, price, inStock, images, group }) =>
  rows.push({
    id,
    title,
    description,
    availability: inStock ? 'in stock' : 'out of stock',
    condition: 'new',
    price: `${Number(price).toFixed(2)} BDT`,
    link: `${SITE}/?product=${encodeURIComponent(group ?? id)}`,
    image_link: images[0] ?? '',
    additional_image_link: images.slice(1, 10).join(','),
    brand: BRAND,
    item_group_id: group ?? '',
  })

// Build-your-own products: one catalog item per option, grouped under the product id
for (const p of content.customCombo?.products ?? []) {
  for (const o of p.options ?? []) {
    add({
      id: o.id,
      title: `${p.name} (${o.name})`,
      description: describe(p),
      price: o.price,
      inStock: p.inStock && o.inStock !== false,
      images: p.images ?? [],
      group: p.id,
    })
  }
}

// Ready combos: one item each
for (const p of content.readyCombos?.products ?? []) {
  add({ id: p.id, title: p.name, description: describe(p), price: p.price, inStock: p.inStock, images: p.images ?? [] })
}

const cols = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'additional_image_link', 'brand', 'item_group_id']
const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n'

const out = join(root, 'public/catalog.csv')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, csv)
console.log(`catalog.csv: ${rows.length} items`)
