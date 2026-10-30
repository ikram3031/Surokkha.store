import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';

// Single-piece trial item (dashboard item 6ae243abbfaa227a68f27f28); each variant is one brand/type
const TRIAL_PACK_SLUG = 'surokkha-trial-pack';
// First add puts this many pieces in; going below it removes the piece
const MIN_PIECES = 2;
const API_BASE_URL = SITE_CONFIG.apiBaseUrl.replace(/\/$/, '');

const resolveImage = (path) => (!path ? '' : /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`);

// Full-width trial pack section shown under the MO lineup. Pieces are added to cart right here, no product page.
export default function TrialPackStrip() {
  const prod = useStore((state) => state.products[TRIAL_PACK_SLUG]);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const setProductQty = useStore((state) => state.setProductQty);
  const { isBn, formatPrice, formatNumber } = useTranslation();

  const variants = (prod?.variants || []).filter((v) => v && v.size);
  if (!prod || prod.isActive === false || variants.length === 0) return null;

  const priceOf = (v) => (Number(v.offerPrice) > 0 && Number(v.offerPrice) < Number(v.price) ? Number(v.offerPrice) : Number(v.price || 0));
  const qtyOf = (v) => cart[`${TRIAL_PACK_SLUG}:::${v.size}`] || 0;
  const pickedPieces = variants.reduce((s, v) => s + qtyOf(v), 0);
  const pickedTotal = variants.reduce((s, v) => s + qtyOf(v) * priceOf(v), 0);

  const step = (v, delta) => {
    const key = `${TRIAL_PACK_SLUG}:::${v.size}`;
    const cur = qtyOf(v);
    if (delta > 0) {
      if (cur === 0) addToCart(TRIAL_PACK_SLUG, MIN_PIECES, true, v);
      else setProductQty(key, cur + 1);
    } else {
      setProductQty(key, cur - 1 < MIN_PIECES ? 0 : cur - 1);
    }
  };

  const packImage = resolveImage(prod.imageUrl || prod.featuredImage) || '/banners/trial-pack-packets.webp';

  return (
    <section className="w-full border-y border-rose-100 bg-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid items-center gap-6 sm:gap-10 md:grid-cols-[1.35fr_1fr]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <img src={packImage} alt={prod.name} loading="lazy" draggable="false" className="aspect-[4/3] w-full object-cover" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#b0213f]">
              {isBn ? 'ট্রায়াল প্যাক' : 'Trial Pack'}
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-heading font-extrabold leading-snug text-slate-900">
              {isBn && prod.name_bn ? prod.name_bn : prod.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-800">
              {isBn ? 'পুরো বক্স কেনার আগে আলাদা আলাদা পিস ট্রাই করে দেখুন' : 'Try single pieces before buying a full box'}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-700">
              {isBn
                ? `যেকোনো পিস বেছে নিন — প্রতিটা কমপক্ষে ${formatNumber(MIN_PIECES)} পিস করে।`
                : `Pick any pieces you like — at least ${MIN_PIECES} of each one you take.`}
            </p>
            {pickedPieces > 0 && (
              <p className="mt-5 text-sm text-slate-800">
                {isBn ? `${formatNumber(pickedPieces)} পিস · ` : `${pickedPieces} pieces · `}
                <b className="text-lg text-[#b0213f]">{formatPrice(pickedTotal)}</b>
              </p>
            )}
          </div>
        </div>

        {/* One card per piece, with its own photo */}
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {variants.map((v) => {
            const price = priceOf(v);
            const n = qtyOf(v);
            const isOut = v.stockStatus === 'outofstock' || v.stockStatus === 'out_of_stock';
            return (
              <li
                key={v.size}
                className={`flex flex-col rounded-2xl border bg-white p-2.5 sm:p-3 shadow-2xs transition ${n > 0 ? 'border-rose-400 ring-2 ring-rose-200' : 'border-rose-100'}`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-rose-50">
                  {v.imageUrl && (
                    <img src={resolveImage(v.imageUrl)} alt={v.size} loading="lazy" draggable="false" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 leading-snug line-clamp-2">{v.size}</p>
                <p className="text-xs text-slate-700">
                  {n > 0 ? (
                    <>
                      {formatNumber(n)} × {formatPrice(price)} = <b className="text-[#b0213f]">{formatPrice(n * price)}</b>
                    </>
                  ) : (
                    <>{formatPrice(price)} / {isBn ? 'পিস' : 'piece'}</>
                  )}
                </p>
                <div className="mt-auto pt-2">
                  {isOut ? (
                    <p className="py-2 text-center text-xs font-semibold text-rose-600">{isBn ? 'স্টক আউট' : 'Out of stock'}</p>
                  ) : n === 0 ? (
                    <button
                      type="button"
                      onClick={() => step(v, 1)}
                      className="w-full rounded-full bg-gradient-to-r from-[#5a1426] to-[#a51d3a] py-2 text-xs font-bold text-white transition hover:from-[#6b1830] hover:to-[#be2446] active:scale-95 cursor-pointer"
                    >
                      {isBn ? `${formatNumber(MIN_PIECES)} পিস যোগ করুন` : `Add ${MIN_PIECES} pcs`}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-full border border-slate-200">
                      <button
                        type="button"
                        onClick={() => step(v, -1)}
                        aria-label={isBn ? `${v.size} কমান` : `Decrease ${v.size}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-[#a51d3a] cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold tabular-nums text-slate-900">{formatNumber(n)}</span>
                      <button
                        type="button"
                        onClick={() => step(v, 1)}
                        aria-label={isBn ? `${v.size} বাড়ান` : `Increase ${v.size}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-[#a51d3a] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
