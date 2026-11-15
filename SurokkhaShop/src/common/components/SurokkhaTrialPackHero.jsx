import React from 'react';
import { useStore } from '../store/useStore';
import CmsHeroSlide from './CmsHeroSlide';

// Home hero slide for the Surokkha Trial Pack (6 variants x 2 pcs = 12 pcs). Price is read live from the product.
const SLUG = 'surokkha-trial-pack';

export default function SurokkhaTrialPackHero() {
  const product = useStore((state) => state.products[SLUG]);
  const price = product ? (product.offerPrice || product.price) : 0;
  const toBn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

  // Free delivery is only shown while a dashboard Direct Offer gives it to the Trial Pack
  const free = product?.freeDelivery === true;
  const slide = {
    badge: free ? '🚚 ফ্রি হোম ডেলিভারি' : '🎁 ৬ ভ্যারিয়েন্ট, ১২ পিস',
    titleDark: 'Surokkha',
    titleAccent: 'Trial Pack',
    tagline: free ? ['12 Pieces', 'Free Delivery'] : ['12 Pieces', '6 Variants'],
    subtitle: free ? '৬ ভ্যারিয়েন্টের ১২ পিস, ডেলিভারি চার্জ ফ্রি' : '৬ ভ্যারিয়েন্টের ১২ পিস, এক প্যাকে',
    chips: [],
    image: product?.imageUrl || '/uploads/2610/261029/surokkha-trial-pack_main_1793258192821.webp',
    imageAlt: 'Surokkha Trial Pack',
    ctaLabel: 'Order Now',
    ctaNote: price ? `মাত্র ৳${toBn(price)}` : '',
    ctaLink: SLUG,
    footnote: '',
  };

  return <CmsHeroSlide slide={slide} />;
}
