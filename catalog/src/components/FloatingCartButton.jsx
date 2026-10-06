import React from 'react';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, toBengaliNumber } from '../utils/formatters';
import { buildWhatsAppLink, generateInquiryMessage } from '../utils/whatsapp';

export const FloatingCartButton = () => {
  const { toggleCart, getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleWhatsAppHelp = () => {
    const url = buildWhatsAppLink(generateInquiryMessage());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end space-y-2.5 pointer-events-none">
      {/* Floating WhatsApp Quick Contact Button */}
      <button
        onClick={handleWhatsAppHelp}
        className="pointer-events-auto flex items-center space-x-2 bg-emerald-600/90 hover:bg-emerald-500 text-white p-3 sm:px-4 sm:py-2.5 rounded-full shadow-xl shadow-emerald-950/60 border border-emerald-400/30 backdrop-blur-md transition-all duration-200 active:scale-95 group"
        title="হোয়াটসঅ্যাপে সরাসরি মেসেজ করুন"
      >
        <MessageCircle className="w-5 h-5 text-white fill-white/20 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold">হোয়াটসঅ্যাপ চ্যাট</span>
      </button>

      {/* Floating Cart Button (only if totalItems > 0) */}
      {totalItems > 0 && (
        <button
          onClick={toggleCart}
          className="pointer-events-auto flex items-center space-x-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 animate-bounce-once"
          aria-label="শপিং কার্ট দেখুন"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
              {toBengaliNumber(totalItems)}
            </span>
          </div>
          <div className="flex flex-col text-left pl-1">
            <span className="text-[11px] font-medium leading-none text-emerald-100">
              কার্ট দেখুন
            </span>
            <span className="text-xs font-black leading-tight text-white">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};
