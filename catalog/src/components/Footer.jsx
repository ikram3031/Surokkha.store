import React from 'react';
import { Lock, Truck, ShieldCheck, MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import { toBengaliNumber } from '../utils/formatters';
import { buildWhatsAppLink, generateInquiryMessage, DISPLAY_PHONE } from '../utils/whatsapp';

export const Footer = () => {
  const handleWhatsApp = () => {
    const url = buildWhatsAppLink(generateInquiryMessage());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="mt-16 bg-slate-900 border-t border-slate-800 text-slate-400 text-sm">
      {/* 4 Trust Pillars Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-850/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-200 text-xs sm:text-sm">১০০% গোপনীয় ডেলিভারি</h4>
            <p className="text-[11px] text-slate-400 mt-1">সম্পূর্ণ নামহীন সাধারণ সিল করা পার্সেল</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-850/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-200 text-xs sm:text-sm">ক্যাশ অন হোম ডেলিভারি</h4>
            <p className="text-[11px] text-slate-400 mt-1">পণ্য হাতে পেয়ে চেক করে মূল্য দিন</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-850/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-200 text-xs sm:text-sm">১০০% আসল প্রোডাক্ট</h4>
            <p className="text-[11px] text-slate-400 mt-1">আমদানিকৃত ও আন্তর্জাতিক ল্যাব সার্টিফাইড</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-850/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-200 text-xs sm:text-sm">হোয়াটসঅ্যাপ হেল্পলাইন</h4>
            <p className="text-[11px] text-slate-400 mt-1">দ্রুত পরামর্শ ও অর্ডার কনফার্মেশন</p>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="text-lg font-bold text-white">সুরক্ষা ডিজিটাল ক্যাটালগ</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-semibold">অফিসিয়াল</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              ইনবক্স ও কাস্টমারদের জন্য সরাসরি দ্রুত অর্ডারের নির্ভরযোগ্য প্ল্যাটফর্ম।
            </p>
          </div>

          {/* Quick Order Steps */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-300 flex flex-col sm:flex-row items-center gap-3">
            <span className="font-bold text-emerald-400">অর্ডার করার সহজ ৩ নিয়ম:</span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span>১. প্রোডাক্ট পছন্দ করুন</span>
              <span>➔</span>
              <span>২. কার্টে যোগ করুন</span>
              <span>➔</span>
              <span>৩. হোয়াটসঅ্যাপে সেন্ড করুন</span>
            </div>
          </div>

          {/* WhatsApp Direct CTA */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>অর্ডার ও হেল্পলাইন: {toBengaliNumber(DISPLAY_PHONE)}</span>
          </button>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Surokkha.store — সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-slate-400">সকল পার্সেল সম্পূর্ণ গোপনীয় ও সিল করা অবস্থায় গ্রাহকের কাছে হস্তান্তর করা হয়।</p>
        </div>
      </div>
    </footer>
  );
};
