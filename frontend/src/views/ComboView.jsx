import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ProductArtwork from '../components/ProductArtwork';
import TestimonialCarousel from '../components/TestimonialCarousel';
import { trackViewContent } from '../utils/analytics';

export default function ComboView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const addToCart = useStore((state) => state.addToCart);
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);
  const { t, isBn, formatPrice, getLocalizedName, getLocalizedTagline } = useTranslation();

  // Dynamically filter all combo categorized products from store
  const comboList = productKeys
    .map((k) => products[k])
    .filter((p) => {
      if (!p) return false;
      const cat = (p.category || '').toLowerCase();
      const catBn = (p.category_bn || '');
      const name = (p.name || '').toLowerCase();
      const nameBn = (p.name_bn || '');
      const id = (p.id || '').toLowerCase();
      return (
        cat.includes('combo') || 
        catBn.includes('কম্বো') || 
        name.includes('combo') || 
        nameBn.includes('কম্বো') || 
        id.includes('combo') || 
        p.iconType === 'combo'
      );
    });

  useEffect(() => {
    if (comboList[0]) {
      trackViewContent(comboList[0]);
    }
  }, [comboList]);

  const comboVariants = [
    {
      key: 'mo-dotted-condom',
      name: isBn ? (products['mo-dotted-condom']?.name_bn || 'MO টেক্সচার্ড ম্যাট্রিক্স') : (products['mo-dotted-condom']?.name || 'MO Textured Matrix'),
      tagline: isBn ? (products['mo-dotted-condom']?.tagline_bn || 'আইএসও সার্টিফাইড টেক্সচার্ড ল্যাটেক্স') : (products['mo-dotted-condom']?.tagline || 'ISO Certified Textured Latex'),
      desc: isBn
        ? (products['mo-dotted-condom']?.description_bn || 'বিশেষভাবে বিন্যস্ত মাইক্রো-টেক্সচার্ড ল্যাটেক্স ম্যাট্রিক্স যা শতভাগ কার্যকর গর্ভনিরোধক ও এসটিআই সংক্রমণ প্রতিরোধ নিশ্চিত করে।')
        : (products['mo-dotted-condom']?.description || 'Micro-textured latex matrix engineered strictly under ISO 4074 standards for safe, dependable contraception.'),
      features: isBn
        ? (products['mo-dotted-condom']?.features_bn || ['আইএসও ৪০৭৪ সার্টিফাইড', 'নিউট্রাল পিএইচ লুব্রিকেশন', 'ইলেকট্রনিক পিনহোল টেস্টেড'])
        : (products['mo-dotted-condom']?.features || ['ISO 4074 certified quality', 'Neutral pH lubrication', 'Electronically pinhole tested']),
    },
    {
      key: 'mo-ultra-thin-condom',
      name: isBn ? (products['mo-ultra-thin-condom']?.name_bn || 'MO আল্ট্রা থিন (০.০৪৫ মিমি)') : (products['mo-ultra-thin-condom']?.name || 'MO Ultra Thin (0.045mm)'),
      tagline: isBn ? (products['mo-ultra-thin-condom']?.tagline_bn || '০.০৪৫ মিমি আল্ট্রা-থিন মেমব্রেন') : (products['mo-ultra-thin-condom']?.tagline || '0.045mm Ultra-Thin Membrane'),
      desc: isBn
        ? (products['mo-ultra-thin-condom']?.description_bn || 'অতি সূক্ষ্ম ও মসৃণ ০.০৪৫ মিমি মেডিক্যাল গ্রেড ল্যাটেক্স মেমব্রেন যা সর্বোচ্চ নমনীয়তার সাথে নির্ভরযোগ্য পরিবার পরিকল্পনা নিশ্চিত করে।')
        : (products['mo-ultra-thin-condom']?.description || 'High-tensile 0.045mm medical latex formulated to provide reliable contraception without compromising durability.'),
      features: isBn
        ? (products['mo-ultra-thin-condom']?.features_bn || ['০.০৪৫ মিমি দেয়াল পুরুত্ব', 'স্মুথ সিলিকন লুব্রিকেশন', 'নিরাপদ পরিবার পরিকল্পনা'])
        : (products['mo-ultra-thin-condom']?.features || ['0.045mm wall thickness', 'Smooth silicone lubrication', 'Reliable family planning']),
    },
    {
      key: 'mo-ultra-ribbed-condom',
      name: isBn ? (products['mo-ultra-ribbed-condom']?.name_bn || 'MO কনট্যুরড রিজ') : (products['mo-ultra-ribbed-condom']?.name || 'MO Contoured Ridges'),
      tagline: isBn ? (products['mo-ultra-ribbed-condom']?.tagline_bn || 'শারীরবৃত্তীয় গ্রিপ ও আরামদায়ক ফিট') : (products['mo-ultra-ribbed-condom']?.tagline || 'Ergonomic Contoured Fit'),
      desc: isBn
        ? (products['mo-ultra-ribbed-condom']?.description_bn || 'ধারাবাহিক রিবড স্ট্রাকচার যা ব্যবহারের সময় পারফেক্ট গ্রিপ, আরাম ও পূর্ণাঙ্গ কন্ট্রাসেপ্টিভ সুরক্ষা প্রদান করে।')
        : (products['mo-ultra-ribbed-condom']?.description || 'Sequential concentric ribbed construction engineered for ergonomic stability, durability, and reliable protection.'),
      features: isBn
        ? (products['mo-ultra-ribbed-condom']?.features_bn || ['শারীরবৃত্তীয় গ্রিপ স্ট্রাকচার', '৫২ মিমি আরামদায়ক ফিট', '১০০% ডাবল সিল টেস্টেড'])
        : (products['mo-ultra-ribbed-condom']?.features || ['Ergonomic ribbed structure', '52mm comfortable fit', '100% double pinhole tested']),
    }
  ];

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen text-slate-800 pb-16">
      
      {/* 1. HERO HEADER (Dark Luxury Theme matching ShopView) */}
      <div className="bg-gradient-to-r from-[#200b14] via-[#15050d] to-[#200b14] text-white py-12 sm:py-16 border-b border-rose-950/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-rose-200/70 mb-4">
            <button onClick={() => navigateTo('home')} className="hover:text-amber-400 transition cursor-pointer">
              {t('product_detail.breadcrumb_home', 'হোম')}
            </button>
            <span>/</span>
            <button onClick={() => navigateTo('shop')} className="hover:text-amber-400 transition cursor-pointer">
              {isBn ? 'শপ' : 'Shop'}
            </button>
            <span>/</span>
            <span className="text-amber-400 font-semibold">{isBn ? 'কম্বো অফার কালেকশন' : 'Combo Offers'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            <span className="text-amber-400">
              {isBn ? 'মেগা ভ্যালু বান্ডেল কালেকশন' : 'Mega Value Bundle Collection'}
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto mt-3 leading-relaxed">
            {isBn
              ? 'আপনার প্রয়োজন অনুযায়ী সেরা ২০ পিস ও ৩০ পিস কম্বো প্যাক নির্বাচন করুন।'
              : 'Choose your ideal 20pcs or 30pcs combo pack.'}
          </p>

          {/* Quick Stats Bar (Dark Theme) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>{isBn ? '১০০% গোপনীয় আনলেবেলড মোড়ক' : '100% Discreet Unmarked Parcel'}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400">✓</span>
              <span>{isBn ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on Delivery Nationwide'}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">★</span>
              <span>{isBn ? 'সর্বোচ্চ সাশ্রয়ী ভ্যালু প্যাক' : 'Maximum Value for Money'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. DYNAMIC COMBO PRODUCTS GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12">
        {/* Results Counter & Quick Reassurance */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80 text-xs sm:text-sm text-slate-700 font-semibold">
          <div>
            <span>{isBn ? 'প্রদর্শিত হচ্ছে:' : 'Showing:'} </span>
            <span className="font-bold text-slate-900">{comboList.length} {isBn ? 'টি কম্বো প্যাক' : 'Combo Packs'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-600 font-bold">✓ {isBn ? '১০০% নামহীন গোপনীয় ডেলিভারি' : '100% Discreet Unmarked Parcel'}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-rose-600 font-bold">✓ {isBn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {isLoadingProducts ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={`skeleton-combo-${idx}`} />
            ))
          ) : (
            comboList.map((prod) => (
              <ProductCard key={prod.id} productKey={prod.id} />
            ))
          )}
        </div>
      </section>

      {/* 3. VARIANT BREAKDOWN (Clean Original Light Box Grid) */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200/60">
              {isBn ? 'সিগনেচার টেক্সচার' : 'Signature Textures'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-2">
              {isBn ? 'MO ভ্যারিয়েন্টের বিশেষত্বসমূহ' : 'Key Characteristics of Each MO Variant'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isBn ? 'প্রতিটি প্যাকে রয়েছে ১০টি ফ্যাক্টরি সিল করা প্রিমিয়াম ল্যাটেক্স কন্ট্রাসেপ্টিভ।' : 'Each individual pack contains 10 factory sealed electronic-tested contraceptives.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comboVariants.map((item) => (
              <div key={item.key} className="bg-[#faf7f8] border border-slate-200/90 rounded-2xl p-6 text-left space-y-3 hover:border-rose-300 transition">
                <div className="w-16 h-20 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-2xs">
                  <ProductArtwork productKey={item.key} sizeClass="w-full h-full aspect-[4/5]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-brand-700 font-semibold">{item.tagline}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 100% DISCREET PACKAGING GUARANTEE */}
      <section className="py-10 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#fff7f8] border border-rose-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 text-center">
          <div className="w-14 h-14 bg-white border border-rose-200/80 rounded-2xl flex items-center justify-center mx-auto text-2xl text-brand-800 shadow-2xs">
            🔒
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              {isBn ? '১০০% গোপনীয় ও নামহীন প্যাকেজিং নিশ্চয়তা' : '100% Discreet Packaging Guarantee'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isBn
                ? 'আপনার সম্পূর্ণ গোপনীয়তা নিশ্চিত করতে পার্সেলটি বাইরে কোনো পণ্যের নাম, ক্যাটাগরি বা ব্র্যান্ড বিবরণ ছাড়া সাধারণ কার্টনে সিল করে পাঠানো হয়। ডেলিভারি পার্সনও জানবেন না ভেতরে কী রয়েছে।'
                : 'All shipments are dispatched inside plain unprinted packaging. Zero sensitive markings appear on the outer parcel label.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() => buyNowDirect('ultra-thin-condoms-20pcs-combo')}
              className="bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm py-3.5 px-8 rounded-2xl shadow-md transition cursor-pointer active:scale-98"
            >
              {isBn ? 'অর্ডার করুন' : 'Order Now'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3.5 px-6 rounded-2xl border border-slate-300 transition cursor-pointer"
            >
              {isBn ? 'সকল প্রোডাক্ট দেখুন' : 'Browse All Products'}
            </button>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER TESTIMONIALS CAROUSEL (Light Theme - Directly Before Footer) */}
      <div className="mt-8">
        <TestimonialCarousel theme="light" />
      </div>

    </div>
  );
}
