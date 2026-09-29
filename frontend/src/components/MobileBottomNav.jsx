import React from 'react';
import { useStore } from '../store/useStore';

export default function MobileBottomNav() {
  const currentView = useStore((state) => state.currentView);
  const navigateTo = useStore((state) => state.navigateTo);

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 h-14">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors cursor-pointer select-none active:scale-95 ${
            currentView === 'home'
              ? 'text-black font-black'
              : 'text-slate-800 hover:text-black font-bold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentView === 'home' ? 'bg-rose-100/90 text-black' : ''}`}>
            <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <span className="text-[11px] tracking-tight">Home</span>
        </button>

        {/* 2. Shop */}
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors cursor-pointer select-none active:scale-95 ${
            currentView === 'shop'
              ? 'text-black font-black'
              : 'text-slate-800 hover:text-black font-bold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentView === 'shop' ? 'bg-rose-100/90 text-black' : ''}`}>
            <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <span className="text-[11px] tracking-tight">Shop</span>
        </button>

        {/* 3. Offers */}
        <button
          type="button"
          onClick={() => navigateTo('combo')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors cursor-pointer select-none active:scale-95 ${
            currentView === 'combo'
              ? 'text-black font-black'
              : 'text-slate-800 hover:text-black font-bold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentView === 'combo' ? 'bg-amber-200/90 text-black' : ''}`}>
            <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.401A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <span className="text-[11px] tracking-tight flex items-center gap-0.5">
            <span>Offers</span>
            <span className="text-[9px]">🔥</span>
          </span>
        </button>

      </div>
    </div>
  );
}
