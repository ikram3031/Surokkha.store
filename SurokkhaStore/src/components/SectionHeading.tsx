/**
 * The one heading used by every section, so titles never drift in size, weight or colour.
 * A short rule in the link colour is the only accent; the title itself is always the text colour.
 */
export function SectionHeading({
  title,
  subtitle,
  align = 'left',
  invert = false,
  className = '',
}: {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  /** For the dark bands, where the text sits on the ink background. */
  invert?: boolean
  className?: string
}) {
  const centered = align === 'center'

  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`}>
      <span aria-hidden="true" className={`block h-1 w-12 rounded-full bg-link ${centered ? 'mx-auto' : ''}`} />
      <h2
        className={`mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl ${
          invert ? 'text-white' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-xl text-base ${invert ? 'text-white/70' : 'text-muted-foreground'} ${
            centered ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
