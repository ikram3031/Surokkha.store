import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const CATEGORIES = [
  {
    slug: 'skin-body-care',
    icon: '🧴',
    nameBn: 'স্কিন ও বডি কেয়ার',
    nameEn: 'Skin & Body Care',
    descBn: 'অ্যালোভেরা জেল, ময়েশ্চারাইজার ও দৈনন্দিন স্কিন কেয়ার',
    descEn: 'Aloe vera gel, moisturizers & daily skin care',
  },
  {
    slug: 'personal-hygiene',
    icon: '🧼',
    nameBn: 'পার্সোনাল হাইজিন',
    nameEn: 'Personal Hygiene',
    descBn: 'ওয়েট ওয়াইপস, স্যানিটাইজার ও পরিচ্ছন্নতা সামগ্রী',
    descEn: 'Wet wipes, sanitizers & daily hygiene essentials',
  },
  {
    slug: 'health-first-aid',
    icon: '🩺',
    nameBn: 'হেলথ ও ফার্স্ট-এইড',
    nameEn: 'Health & First-Aid',
    descBn: 'ফার্স্ট-এইড, পেন রিলিফ ও হেলথকেয়ার সামগ্রী',
    descEn: 'First-aid kits, pain relief & healthcare essentials',
  },
  {
    slug: 'contraceptive',
    icon: '🛡️',
    nameBn: 'কন্ট্রাসেপ্টিভ',
    nameEn: 'Contraceptive',
    descBn: 'সার্টিফাইড প্রিমিয়াম প্রোটেকশন সামগ্রী',
    descEn: 'Certified premium protection essentials',
  },
];

// Displays the 4 main storefront product categories on the home page
const CategoryShowcase = () => {
  const navigateTo = useStore((state) => state.navigateTo);
  const { isBn } = useTranslation();

  return (
    <section id="categoryShowcase" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
        <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1.5">
          <span>✨</span>
          <span>{isBn ? 'ক্যাটাগরি' : 'Categories'}</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
          {isBn ? 'প্রয়োজন অনুযায়ী পণ্য বেছে নিন' : 'Shop by Category'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
          {isBn ? 'স্বাস্থ্য, সুস্থতা ও পার্সোনাল কেয়ারের সেরা কালেকশন।' : 'Explore our curated health, wellness & personal care collections.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => navigateTo('shop', cat.slug)}
            className="group bg-white border border-rose-100 hover:border-rose-300 rounded-3xl p-5 sm:p-6 text-left shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3"
          >
            <div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-105 transition-transform">
                {cat.icon}
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-bold font-heading text-slate-900 group-hover:text-brand-700 transition-colors">
                {isBn ? cat.nameBn : cat.nameEn}
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {isBn ? cat.descBn : cat.descEn}
              </p>
            </div>
            <span className="text-xs font-bold text-brand-700 inline-flex items-center gap-1">
              {isBn ? 'সব দেখুন →' : 'Browse →'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryShowcase;
