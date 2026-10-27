const items = [
  {
    title: 'Discreet packaging',
    desc: 'Nothing on the pack gives away the product.',
    path: 'M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9',
  },
  {
    title: '100% genuine products',
    desc: 'Sourced directly from authorised suppliers.',
    path: 'M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Zm-3 9 2.2 2.2L15.5 10',
  },
  {
    title: 'Cash on delivery',
    desc: 'Pay when you receive the product.',
  },
  {
    title: 'Fast delivery',
    desc: '1 day in Dhaka, 2–3 days nationwide.',
    path: 'M12 7v5l3 2',
    circle: true,
  },
]

export function TrustStripClassic() {
  return (
    <section id="why" className="border-y border-border bg-gradient-to-b from-secondary/50 to-background">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {item.title === 'Cash on delivery' ? (
                  <>
                    <rect x="2.5" y="6" width="19" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.6" />
                  </>
                ) : item.circle ? (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d={item.path} />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                )}
              </svg>
            </span>
            <div>
              <h3 className="font-display text-lg font-bold leading-snug">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
