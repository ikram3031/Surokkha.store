import React from 'react';
import { useStore, TRIAL_PACK_SLUG } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const MEGA_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';

// Scrolling offer ticker above the header. Pauses on hover; each message opens its product.
export default function AnnouncementMarquee() {
  const openProduct = useStore((state) => state.openProduct);
  const navigateTo = useStore((state) => state.navigateTo);
  const products = useStore((state) => state.products);
  const { isBn, formatPrice } = useTranslation();

  const trial = products[TRIAL_PACK_SLUG];
  // The free-delivery message only runs while the Trial Pack exists and can be bought
  const trialOnSale = Boolean(trial) && trial.isActive !== false && !trial.isOutOfStock &&
    trial.stockStatus !== 'outofstock' && trial.stockStatus !== 'out_of_stock' && trial.stockAmount !== 0;
  const trialPrice = trial ? Number(trial.offerPrice || trial.price || 0) : 0;
  const mega = products[MEGA_COMBO_SLUG];
  const megaPrice = Number(mega?.offerPrice || 950);
  const megaOld = Math.max(1350, Number(mega?.price || 0), Number(mega?.regularPrice || 0));
  const megaPct = megaOld > megaPrice ? Math.round(((megaOld - megaPrice) / megaOld) * 100) : 0;

  const messages = [
    trialOnSale && {
      lead: isBn ? '🚚 ফ্রি ডেলিভারি!' : '🚚 Free Delivery!',
      text: isBn
        ? `সুরক্ষা ট্রায়াল প্যাক: ৬ ভ্যারিয়েন্টের ১২ পিস${trialPrice ? ` মাত্র ${formatPrice(trialPrice)}` : ''}, সাথে ফ্রি হোম ডেলিভারি`
        : `Surokkha Trial Pack: 12 pcs of 6 variants${trialPrice ? ` for ${formatPrice(trialPrice)}` : ''}, with free home delivery`,
      action: isBn ? 'অর্ডার করুন →' : 'Order now →',
      onClick: () => openProduct(TRIAL_PACK_SLUG),
    },
    {
      lead: isBn ? `🔥 ${megaPct}% ছাড়!` : `🔥 ${megaPct}% OFF!`,
      text: isBn
        ? `৩০ পিসের মেগা কম্বো, ৳${megaOld} এর বদলে মাত্র ৳${megaPrice}`
        : `30 piece Mega Combo, only ৳${megaPrice} instead of ৳${megaOld}`,
      action: isBn ? 'অফারটি দেখুন →' : 'See offer →',
      onClick: () => openProduct(MEGA_COMBO_SLUG),
    },
    {
      lead: isBn ? '🚚 ফ্রি ডেলিভারি!' : '🚚 Free Delivery!',
      text: isBn ? '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি' : 'Free delivery on orders over ৳1,000',
      action: isBn ? 'শপ দেখুন →' : 'Shop now →',
      onClick: () => navigateTo('shop'),
    },
    {
      lead: isBn ? '📦 ১০০% গোপনীয়' : '📦 100% Discreet',
      text: isBn ? 'লেবেল ছাড়া সিল করা পার্সেল, ক্যাশ অন ডেলিভারি' : 'Unlabelled sealed parcel, cash on delivery',
      action: isBn ? 'শপ দেখুন →' : 'Shop now →',
      onClick: () => navigateTo('shop'),
    },
  ].filter(Boolean);

  const renderSet = (hidden) => (
    <div className="flex items-center shrink-0" aria-hidden={hidden || undefined}>
      {messages.map((m, i) => (
        <button
          key={i}
          type="button"
          tabIndex={hidden ? -1 : undefined}
          onClick={m.onClick}
          className="flex items-center gap-2 pl-4 sm:pl-5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="font-extrabold text-sm sm:text-[15px] text-[#b0213f]">{m.lead}</span>
          <span className="font-semibold text-sm sm:text-[15px] text-black">{m.text}</span>
          <span className="font-bold text-sm sm:text-[15px] text-[#b0213f] underline underline-offset-4">{m.action}</span>
          <span className="ml-4 sm:ml-5 w-1.5 h-1.5 rounded-full bg-[#b0213f] shrink-0" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-[#fde8ec] via-[#fff5e6] to-[#fde8ec] text-black border-b border-rose-200 py-2 select-none overflow-hidden group">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center whitespace-nowrap">
        {renderSet(false)}
        {renderSet(true)}
      </div>
    </div>
  );
}
