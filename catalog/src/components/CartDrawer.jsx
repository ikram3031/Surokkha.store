import React, { useEffect } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, Truck, Lock, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, toBengaliNumber } from '../utils/formatters';
import { buildWhatsAppLink, generateCartOrderMessage } from '../utils/whatsapp';

export const CartDrawer = () => {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleConfirmOrderWhatsApp = () => {
    if (items.length === 0) return;
    const message = generateCartOrderMessage(items, totalPrice);
    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over Sidebar Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                আপনার শপিং কার্ট
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                {toBengaliNumber(totalItems)} টি আইটেম
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="কার্ট বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-200">
                    আপনার কার্ট এখনও খালি!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    ক্যাটালগ থেকে আপনার পছন্দের কনডম, লং টাইম স্প্রে বা কম্বো প্রোডাক্ট কার্টে যোগ করুন।
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
                >
                  <span>প্রোডাক্ট ব্রাউজ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              items.map((item) => {
                const unitPrice = item.offerPrice ?? item.price ?? 0;
                const subtotal = unitPrice * (item.quantity || 1);

                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3 hover:border-slate-600 transition-all"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-900 border border-slate-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    {/* Details & Controls */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                        {item.name}
                      </h4>
                      {item.packSize && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.packSize}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            aria-label="পরিমাণ কমান"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {toBengaliNumber(item.quantity)}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            aria-label="পরিমাণ বাড়ান"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400">
                            {formatPrice(subtotal)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[10px] text-slate-400">
                              @{formatPrice(unitPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
                      title="আইটেমটি বাদ দিন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer Summary & CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 space-y-3">
              {/* Delivery Note */}
              <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-2.5 text-[11px] sm:text-xs text-emerald-300 space-y-1">
                <div className="flex items-center font-semibold">
                  <Truck className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-emerald-400" />
                  <span>ঢাকার ভিতরে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা ডেলিভারি চার্জ</span>
                </div>
                <div className="flex items-center text-slate-400 text-[10px] sm:text-[11px]">
                  <Lock className="w-3 h-3 mr-1.5 flex-shrink-0 text-slate-400" />
                  <span>১০০% গোপনীয় আনলেবেলড প্যাকেজিং ও ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>

              {/* Price Calculation Row */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>মোট প্রোডাক্ট:</span>
                  <span>{toBengaliNumber(totalItems)} টি</span>
                </div>
                <div className="flex items-center justify-between text-base sm:text-lg font-bold text-white border-t border-slate-800 pt-2">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-400 text-xl font-black">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Big Prominent WhatsApp Order CTA */}
              <button
                onClick={handleConfirmOrderWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-500 active:scale-95 text-white shadow-xl shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-white fill-white/20" />
                <span>হোয়াটসঅ্যাপে অর্ডার কনফার্ম করুন</span>
              </button>

              {/* Clear Cart Button */}
              <div className="flex justify-between items-center pt-1 text-[11px]">
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span>কার্ট খালি করুন</span>
                </button>
                <span className="text-slate-400">সুরক্ষা হেল্পলাইন: ০১৬০০৯০৫৭৭৪</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
