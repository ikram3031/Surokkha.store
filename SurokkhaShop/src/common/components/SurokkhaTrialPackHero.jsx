import React from 'react';
import { useStore } from '../store/useStore';
import CmsHeroSlide from './CmsHeroSlide';

// Home hero slide for the Surokkha Trial Pack (7 variants x 2 pcs = 14 pcs).
const SLUG = 'surokkha-trial-pack';

export default function SurokkhaTrialPackHero() {
  const product = useStore((state) => state.products[SLUG]);

  // Free delivery is only shown while a dashboard Direct Offer gives it to the Trial Pack
  const free = product?.freeDelivery === true;
  const slide = {
    badge: free ? '🚚 ফ্রি হোম ডেলিভারি' : '🎁 ৭ ভ্যারিয়েন্ট, ১৪ পিস',
    titleDark: '',
    titleAccent: 'Trial Pack',
    tagline: free ? ['14 Pieces', 'Free Delivery'] : ['14 Pieces', '7 Variants'],
    subtitle: '',
    chips: [],
    image: product?.imageUrl || '/uploads/2610/261029/surokkha-trial-pack_main_1793258192821.webp',
    imageAlt: 'Trial Pack',
    ctaLabel: 'Order Now',
    ctaNote: '',
    ctaLink: SLUG,
    footnote: '',
  };

  return <CmsHeroSlide slide={slide} />;
}
