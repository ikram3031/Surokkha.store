import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function NotFoundView() {
  const navigateTo = useStore((state) => state.navigateTo);

  useEffect(() => {
    const prev = document.title;
    document.title = 'পেজটি পাওয়া যায়নি | Surokkha';
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#faf5f6] via-white to-[#faf5f6]/60 min-h-[70vh] flex items-center">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-8xl sm:text-9xl font-black tracking-tight bg-gradient-to-r from-[#200b14] via-rose-700 to-amber-500 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">পেজটি খুঁজে পাওয়া যায়নি</h1>
        <p className="mt-3 text-slate-600">
          আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল। নিচের যেকোনো অপশন থেকে আবার শুরু করুন।
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigateTo('home')}
            className="px-6 py-3 rounded-full bg-[#200b14] text-white font-semibold hover:bg-rose-900 transition cursor-pointer"
          >
            হোমে ফিরে যান
          </button>
          <button
            onClick={() => navigateTo('shop')}
            className="px-6 py-3 rounded-full border border-slate-300 bg-white text-slate-800 font-semibold hover:border-rose-400 hover:text-rose-700 transition cursor-pointer"
          >
            সব প্রোডাক্ট দেখুন
          </button>
        </div>

        <button
          onClick={() => navigateTo('contact')}
          className="mt-6 text-sm text-slate-500 hover:text-rose-700 underline underline-offset-4 cursor-pointer"
        >
          সাহায্য দরকার? যোগাযোগ করুন
        </button>
      </div>
    </div>
  );
}
