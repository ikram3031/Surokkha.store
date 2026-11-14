import { SectionBackground } from '@/components/SectionBackground'
import { SectionHeading } from '@/components/SectionHeading'
import { L } from '@/lib/i18n'

export const tips = [
  {
    title: L('Check the expiry date', 'মেয়াদ শেষের তারিখ দেখে নিন'),
    desc: L('Do not use a pack once the expiry date printed on it has passed.', 'প্যাকেটে ছাপা মেয়াদ শেষ হয়ে গেলে সেটি ব্যবহার করবেন না।'),
  },
  {
    title: L('Choose the right lubricant', 'সঠিক লুব্রিকেন্ট বেছে নিন'),
    desc: L('Use water or silicone based lubricant with latex condoms. Anything oil based can damage the condom.', 'ল্যাটেক্স কনডমের সাথে পানি বা সিলিকন-ভিত্তিক লুব্রিকেন্ট ব্যবহার করুন। তেল-ভিত্তিক কিছু কনডমের ক্ষতি করতে পারে।'),
  },
  {
    title: L('Store in a cool, dry place', 'ঠান্ডা ও শুকনো জায়গায় রাখুন'),
    desc: L('Keeping condoms in a wallet or car for long periods exposes them to heat and damages them.', 'মানিব্যাগ বা গাড়িতে দীর্ঘ সময় কনডম রাখলে তাপে নষ্ট হয়ে যায়।'),
  },
]

export function SafeUse() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <SectionBackground name="safe-use" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <SectionHeading
            title={L('Three things to know about safe use', 'নিরাপদ ব্যবহারে যে ৩টি বিষয় জানা জরুরি')}
            subtitle={L('Condoms only protect fully when used correctly. Keep these in mind before you buy and before you use.', 'সঠিকভাবে ব্যবহার করলেই কনডম পুরোপুরি সুরক্ষা দেয়। কেনার ও ব্যবহারের আগে এগুলো মনে রাখুন।')}
          />
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
