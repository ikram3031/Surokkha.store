// Decorative product-art icons, ported 1:1 from the original static SVG strings.
// These colors are per-product illustration data (set in src/data/products.ts),
// not UI chrome, so they stay as explicit hex rather than theme tokens.

function HeartMark({ fill = '#fff' }: { fill?: string }) {
  return (
    <path
      d="M60 84 C44 72 38 64 38 57 C38 52 42 49 46 49 C52 49 57 52 60 57 C63 52 68 49 74 49 C78 49 82 52 82 57 C82 64 76 72 60 84Z"
      fill={fill}
      opacity={0.92}
    />
  )
}

export function BoxIcon({ c1, c2 }: { c1: string; c2: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect x="20" y="28" width="80" height="66" rx="9" fill={c1} />
      <rect x="20" y="28" width="80" height="19" rx="9" fill={c2} />
      <rect x="20" y="38" width="80" height="9" fill={c2} />
      <HeartMark />
    </svg>
  )
}

export function BottleIcon({ c1, c2 }: { c1: string; c2: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect x="52" y="14" width="30" height="8" rx="3" fill={c2} />
      <rect x="62" y="20" width="10" height="14" fill={c2} />
      <rect x="40" y="32" width="40" height="76" rx="10" fill={c1} />
      <rect x="40" y="32" width="40" height="12" rx="6" fill={c2} />
      <HeartMark fill="#F4919F" />
    </svg>
  )
}

export function ComboIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g transform="translate(-14 6) scale(.8)">
        <rect x="20" y="28" width="80" height="66" rx="9" fill="#F4919F" />
        <rect x="20" y="28" width="80" height="19" rx="9" fill="#C9475F" />
      </g>
      <g transform="translate(34 4) scale(.85)">
        <rect x="40" y="32" width="40" height="76" rx="10" fill="#F5E6D3" />
        <rect x="40" y="32" width="40" height="12" rx="6" fill="#948B86" />
        <rect x="52" y="18" width="16" height="16" rx="3" fill="#948B86" />
      </g>
    </svg>
  )
}

/** Outline heart mark used as the brand logo (header, footer, age gate, hero). */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 190" className={className} aria-hidden="true">
      <path
        d="M100 172 C42 130 14 96 14 64 C14 38 33 22 54 22 C73 22 90 33 100 50 C110 33 127 22 146 22 C167 22 186 38 186 64 C186 96 158 130 100 172Z"
        fill="none"
        stroke="var(--brand-blush)"
        strokeWidth={22}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type ProductArt = 'box' | 'bottle' | 'combo'

export function ProductArtIcon({
  art,
  c1,
  c2,
}: {
  art: ProductArt
  c1?: string
  c2?: string
}) {
  if (art === 'box') return <BoxIcon c1={c1 ?? '#F4919F'} c2={c2 ?? '#C9475F'} />
  if (art === 'bottle') return <BottleIcon c1={c1 ?? '#F5E6D3'} c2={c2 ?? '#948B86'} />
  return <ComboIcon />
}
