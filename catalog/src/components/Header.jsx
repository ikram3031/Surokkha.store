import React from 'react';
import { ShoppingBag, Search, X, MessageCircle, ShieldCheck, Truck, Lock } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, toBengaliNumber } from '../utils/formatters';
import { buildWhatsAppLink, generateInquiryMessage, DISPLAY_PHONE } from '../utils/whatsapp';

export const Header = ({ searchQuery, setSearchQuery }) => {
  const { toggleCart, getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleWhatsAppContact = () => {
    const url = buildWhatsAppLink(generateInquiryMessage());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      {/* Top Notice / Trust Bar */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-900/40 text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar py-0.5">
            <span className="flex items-center text-emerald-400 font-medium whitespace-nowrap">
              <Lock className="w-3.5 h-3.5 mr-1 text-emerald-400 inline" /> ১০০% গোপনীয় সিলড পার্সেল
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center whitespace-nowrap text-slate-300">
              <Truck className="w-3.5 h-3.5 mr-1 text-emerald-400 inline" /> সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="flex items-center whitespace-nowrap text-slate-300 hidden md:flex">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400 inline" /> আসল ও সার্টিফাইড প্রোডাক্ট
            </span>
          </div>
          
          <button
            onClick={handleWhatsAppContact}
            className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors font-medium ml-auto"
            title="হোয়াটসঅ্যাপে যোগাযোগ"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400 fill-emerald-500/20" />
            <span>হেল্পলাইন: {toBengaliNumber(DISPLAY_PHONE)}</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 flex-shrink-0">
            <a href="#" className="flex items-center space-x-2.5 group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Surokkha Logo"
                  className="h-9 sm:h-11 w-auto object-contain drop-shadow"
                  onError={(e) => {
                    // Fallback to text badge if logo.png is missing
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  style={{ display: 'none' }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-950/40"
                >
                  সু
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  সুরক্ষা <span className="text-emerald-400 font-semibold text-xs sm:text-sm px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 ml-1">ক্যাটালগ</span>
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 tracking-wide">
                  ইনবক্স কাস্টমার ডিজিটাল ক্যাটালগ
                </span>
              </div>
            </a>
          </div>

          {/* Search Input (Center/Desktop & Tablet) */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="প্রোডাক্টের নাম, ধরণ বা ব্র্যান্ড খুঁজুন..."
                className="w-full bg-slate-800/90 hover:bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-9 py-2 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons (Right) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Direct WhatsApp Help Button */}
            <button
              onClick={handleWhatsAppContact}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs sm:text-sm font-medium transition-all"
              title="সরাসরি হোয়াটসঅ্যাপে প্রশ্ন করুন"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>হোয়াটসঅ্যাপ সাপোর্ট</span>
            </button>

            {/* Cart Drawer Trigger Button */}
            <button
              onClick={toggleCart}
              className="relative flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all"
              aria-label="শপিং কার্ট খুলুন"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-semibold">কার্ট</span>
              {totalPrice > 0 && (
                <span className="hidden md:inline text-emerald-100 font-bold border-l border-emerald-500/40 pl-2">
                  {formatPrice(totalPrice)}
                </span>
              )}
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
                  {toBengaliNumber(totalItems)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input (Visible only on small screens) */}
        <div className="mt-2.5 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন (নাম, ব্র্যান্ড বা সাইজ)..."
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
