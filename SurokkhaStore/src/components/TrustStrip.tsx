const items = [
  {
    title: 'গোপন প্যাকেজিং',
    desc: 'প্যাকেটের গায়ে পণ্যের নাম লেখা থাকে না।',
    path: 'M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9',
  },
  {
    title: '১০০% আসল পণ্য',
    desc: 'সরাসরি অনুমোদিত সরবরাহকারীর কাছ থেকে সংগ্রহ।',
    path: 'M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Zm-3 9 2.2 2.2L15.5 10',
  },
  {
    title: 'ক্যাশ অন ডেলিভারি',
    desc: 'পণ্য হাতে পেয়ে টাকা দিন।',
  },
  {
    title: 'দ্রুত ডেলিভারি',
    desc: 'ঢাকায় ১ দিনে, সারা দেশে ২-৩ দিনে।',
    path: 'M12 7v5l3 2',
    circle: true,
  },
]

export function TrustStrip() {
  return (
    <section id="why" className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3">
            <svg
              className="mt-1 h-6 w-6 shrink-0 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {item.title === 'ক্যাশ অন ডেলিভারি' ? (
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
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
