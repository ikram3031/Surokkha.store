import React, { useEffect } from 'react';
import { useStore, isTrialPackSlug } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from '../components/ProductCard';
import GroupOfferCard from '../components/GroupOfferCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import MoLineupCarousel from '../components/MoLineupCarousel';
import TestimonialCarousel from '../components/TestimonialCarousel';
import { trackViewContent } from '../utils/analytics';

// Combo view displaying bundle offers and signature wellness variants
const ComboView = () => {
  const navigateTo = useStore((state) => state.navigateTo);
  const addToCart = useStore((state) => state.addToCart);
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);
  const groupOffers = useStore((state) => state.groupOffers);
  const fetchGroupOffers = useStore((state) => state.fetchGroupOffers);
  useEffect(() => { fetchGroupOffers(); }, [fetchGroupOffers]);
  const { t, isBn, formatPrice, getLocalizedName, getLocalizedTagline, getLocalizedDescription } = useTranslation();

  const comboList = productKeys
    .map((k) => products[k])
    .filter((p) => {
      if (!p) return false;
      const isOutOfStock = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
      if (isOutOfStock) return false;
      return Boolean(p.directOffer) || isTrialPackSlug(p.slug);
    })
    .sort((a, b) => {
      const aItem = a.itemType === 'item' ? 1 : 0;
      const bItem = b.itemType === 'item' ? 1 : 0;
      return aItem - bItem;
    });

  useEffect(() => {
    if (comboList[0]) {
      trackViewContent(comboList[0]);
    }
  }, [comboList]);

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen text-slate-800 pb-16">

      <div className="max-md:hidden bg-gradient-to-r from-[#200b14] via-[#15050d] to-[#200b14] text-white py-12 sm:py-16 border-b border-rose-950/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

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
              ? 'আপনার প্রয়োজন অনুযায়ী সেরা ভ্যালু কম্বো প্যাক নির্বাচন করুন।'
              : 'Choose your ideal value combo pack.'}
          </p>
        </div>
      </div>

      {groupOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mb-5">{isBn ? 'গ্রুপ অফার' : 'Group Offers'}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {groupOffers.map((o) => <GroupOfferCard key={o.id} offer={o} />)}
          </div>
        </section>
      )}

      {(isLoadingProducts || comboList.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12">
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
      )}

      <section id="offerMoLineup" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
            {t('theMoLineup', 'The MO Lineup')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
            {t('home.lineup_desc', 'Authentic quality-tested health and wellness essentials engineered for everyday care.')}
          </p>
        </div>

        <MoLineupCarousel />
      </section>

      <div className="mt-8">
        <TestimonialCarousel theme="light" />
      </div>

    </div>
  );
};

export default ComboView;
