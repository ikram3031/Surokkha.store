import React from 'react';
import { useStore } from '../store/useStore';

export default function Toast() {
  const toast = useStore((state) => state.toast);

  if (!toast.show) return null;

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 bg-[#18050e] text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-rose-800/60 transition-all duration-300 transform translate-y-0 opacity-100">
      <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{toast.message}</span>
    </div>
  );
}
