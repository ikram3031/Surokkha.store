import React from 'react';
import { useStore, TRIAL_PACK_SLUG } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from './ProductArtwork';

// Cart drawer offer card for the Surokkha Trial Pack (adding it makes delivery free).
export default function TrialPackOfferCard({ compact = false }) {
  const product = useStore((state) => state.products[TRIAL_PACK_SLUG]);
  const addToCart = useStore((state) => state.addToCart);
  const openProduct = useStore((state) => state.openProduct);
  const closeCartDrawer = useStore((state) => state.closeCartDrawer);
  const { isBn, formatPrice } = useTranslation();

  if (!product || product.isOutOfStock || product.isActive === false || product.stockAmount === 0) return null;
  const price = Number(product.offerPrice || product.price || 0);

  const goToProduct = () => {
    if (closeCartDrawer) closeCartDrawer();
    openProduct(TRIAL_PACK_SLUG);
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-3.5 text-left space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-wide">
          {isBn ? '🎁 অফার চলছে' : '🎁 Offer Live'}
        </span>
        <span className="text-[11px] font-extrabold text-emerald-700">
          🚚 {isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!compact && (
          <button type="button" onClick={goToProduct} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-rose-200 cursor-pointer">
            <ProductArtwork productKey={product} customImageUrl={product.imageUrl} sizeClass="w-full h-full" imgClassName="w-full h-full object-cover" sizes="64px" />
          </button>
        )}
        <div className="min-w-0">
          <button type="button" onClick={goToProduct} className="text-sm font-extrabold text-black hover:text-rose-700 cursor-pointer text-left">
            {isBn ? 'সুরক্ষা ট্রায়াল প্যাক' : 'Surokkha Trial Pack'}
          </button>
          <p className="text-[11px] text-black leading-snug mt-0.5">
            {isBn
              ? `৬টি ভ্যারিয়েন্ট × ২ পিস = ১২ পিস${price ? `, মাত্র ${formatPrice(price)}` : ''}। যোগ করলে পুরো অর্ডারে ডেলিভারি ফ্রি!`
              : `6 variants × 2 pcs = 12 pcs${price ? ` for ${formatPrice(price)}` : ''}. Add it and delivery is free on the whole order!`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => addToCart(TRIAL_PACK_SLUG, 1, true)}
        className="w-full bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white text-xs font-extrabold py-2.5 px-3 rounded-xl transition cursor-pointer shadow-xs active:scale-98"
      >
        {isBn ? `ট্রায়াল প্যাক যোগ করুন${price ? ` (${formatPrice(price)})` : ''}` : `Add Trial Pack${price ? ` (${formatPrice(price)})` : ''}`}
      </button>
    </div>
  );
}
