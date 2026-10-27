import { SectionBackground } from '@/components/SectionBackground'

const tips = [
  {
    title: 'মেয়াদ দেখে নিন',
    desc: 'প্যাকেটের গায়ে লেখা মেয়াদোত্তীর্ণের তারিখ পার হয়ে গেলে ব্যবহার করবেন না।',
  },
  {
    title: 'সঠিক লুব্রিকেন্ট বেছে নিন',
    desc: 'ল্যাটেক্স কনডমের সাথে ওয়াটার বা সিলিকন বেসড লুব্রিকেন্ট ব্যবহার করুন। তেলভিত্তিক কিছু ব্যবহার করলে কনডম নষ্ট হতে পারে।',
  },
  {
    title: 'ঠান্ডা ও শুকনো জায়গায় রাখুন',
    desc: 'ওয়ালেট বা গাড়িতে দীর্ঘদিন রাখলে তাপে কনডমের ক্ষতি হয়।',
  },
]

export function SafeUse() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <SectionBackground name="safe-use" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold leading-snug">
            নিরাপদ ব্যবহারের তিনটি কথা
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            সঠিকভাবে ব্যবহার করলেই কনডম পুরো সুরক্ষা দেয়। কেনার আগে ও ব্যবহারের আগে এগুলো মাথায়
            রাখুন।
          </p>
        </div>
        <ol className="space-y-4">
          {tips.map((tip) => (
            <li key={tip.title} className="rounded-2xl bg-background p-5">
              <h3 className="font-semibold">{tip.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tip.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
