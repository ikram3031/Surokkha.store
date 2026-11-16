import React from 'react';
import { useStore } from '../store/useStore';
import ProductArtwork from './ProductArtwork';
import {
  TODAY_OFFER,
  isTodayOfferLive,
  findSmartPack,
  toBn,
  todayOfferSaving,
  TodayOfferCountdown,
} from './TodayOfferHero';

// Cart drawer promo for today's MO Smart Pack offer: discount badge (taka + %) and the same
// countdown as the home hero. Shows only while the offer is live.
export default function TodayOfferCartCard() {
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const openProduct = useStore((state) => state.openProduct);
  const closeCartDrawer = useStore((state) => state.closeCartDrawer);

  const product = findSmartPack(products);
  if (!isTodayOfferLive() || !product || product.isOutOfStock || product.stockAmount === 0) return null;

  const slug = product.slug || product.id;
  const { save, pct } = todayOfferSaving(product);
  const inCart = Object.keys(cart).some((k) => k.split(':::')[0] === slug && cart[k] > 0);

  const goToProduct = () => {
    if (closeCartDrawer) closeCartDrawer();
    openProduct(slug);
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-300 rounded-2xl p-3.5 text-left space-y-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <button type="button" onClick={goToProduct} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-rose-200 cursor-pointer">
          <ProductArtwork productKey={product} customImageUrl={product.imageUrl} sizeClass="w-full h-full" imgClassName="w-full h-full object-cover" sizes="64px" />
        </button>
        <div className="min-w-0 space-y-1">
          {save > 0 && (
            <span className="inline-block text-[11px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md">
              🔥 আজ {toBn(pct)}% ছাড় · ৳{toBn(save)} সাশ্রয়
            </span>
          )}
          <p className="text-sm font-extrabold text-[#4a0f1f] leading-tight">MO Smart Pack</p>
          <p className="text-xs font-bold text-slate-700">
            শুধু আজ <span className="text-rose-600 font-extrabold">৳{toBn(TODAY_OFFER.price)}</span>
          </p>
        </div>
      </div>

      <TodayOfferCountdown small className="justify-center" />

      {inCart ? (
        <p className="text-xs font-extrabold text-emerald-700 text-center">
          ✓ কার্টে আছে — আপনি ৳{toBn(save)} ({toBn(pct)}%) ছাড়ে পাচ্ছেন
        </p>
      ) : (
        <button
          type="button"
          onClick={() => addToCart(slug, 1, true)}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-md transition active:scale-98 cursor-pointer"
        >
          ৳{toBn(save)} ছাড়ে কার্টে যোগ করুন
        </button>
      )}
    </div>
  );
}
