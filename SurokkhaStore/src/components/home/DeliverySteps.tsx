const steps = [
  {
    title: 'Order online',
    text: 'Check out as a guest, no account needed. Cash on delivery is available.',
  },
  {
    title: 'We pack it plainly',
    text: 'A plain box with nothing on the outside about what is inside.',
  },
  {
    title: 'Delivered to you',
    text: '1 day in Dhaka and 2–3 days nationwide. Pay when it arrives.',
  },
]

/** Dark band explaining the discreet delivery in three steps. */
export function DeliverySteps() {
  return (
    <section id="delivery" className="scroll-mt-20 bg-foreground py-16 text-background md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-bold md:text-4xl">How private delivery works</h2>
        <p className="mt-4 max-w-lg text-background/70">
          From checkout to your door, nobody else needs to know what you ordered.
        </p>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-background/20 pt-6">
              <span className="text-sm font-semibold text-accent">Step {i + 1}</span>
              <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
