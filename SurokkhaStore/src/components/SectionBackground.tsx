import { useSectionBackground } from '@/hooks/useSectionBackground'

/**
 * Full-bleed CMS background for a section. The parent must be `relative`, and its content
 * `relative` too so it sits above this layer. Renders nothing when no image is set.
 */
export function SectionBackground({ name }: { name: string }) {
  const url = useSectionBackground(name)
  if (!url) return null

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${url}")` }}
      />
      {/* light veil keeps the dark text readable on any image */}
      <div aria-hidden="true" className="absolute inset-0 bg-background/70" />
    </>
  )
}
