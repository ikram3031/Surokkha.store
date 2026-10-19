import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function RefundView() {
  const navigateTo = useStore((state) => state.navigateTo);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen text-slate-800 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#200b14] via-[#15050d] to-[#200b14] text-white py-12 sm:py-16 border-b border-rose-950/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-rose-200/70 mb-4">
            <button onClick={() => navigateTo('home')} className="hover:text-amber-400 transition cursor-pointer">
              Home
            </button>
            <span>/</span>
            <span className="text-amber-300">Return & Refund Policy</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <span>🔄</span> Customer Satisfaction Guarantee
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Return & Refund Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-rose-100/70 max-w-xl mx-auto">
            Clear, transparent, and hassle-free returns for genuine product issues.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">

          {/* Intimate Health Notice */}
          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Health & Hygiene Standard</h3>
              <p className="text-xs text-amber-900 mt-1">
                Due to the intimate, medical, and personal nature of contraceptive healthcare supplies, opened retail boxes or tampered seals cannot be returned or restocked for health and safety regulations.
              </p>
            </div>
          </div>

          {/* Section 1: Eligible Scenarios for Replacement / Refund */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">1</span>
              Eligible Return Situations
            </h2>
            <p>
              We stand behind 100% product authenticity and quality. You are entitled to a <strong>free immediate replacement</strong> or <strong>100% refund</strong> under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Damaged in Transit:</strong> The retail packaging is crushed, torn, or compromised upon delivery handoff.</li>
              <li><strong>Incorrect Product Delivered:</strong> You received a different variant or quantity than what was ordered.</li>
              <li><strong>Manufacturing Defect / Broken Factory Seal:</strong> The inner factory safety seal is compromised upon initial inspection.</li>
            </ul>
          </section>

          {/* Section 2: Reporting Window (24 - 48 Hours) */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">2</span>
              Reporting Timeframe (24 – 48 Hours)
            </h2>
            <p>
              Please inspect your package upon receipt. If there is any defect or discrepancy, notify our support team within <strong>24 to 48 hours</strong> of parcel delivery. Please provide a clear photo or short video showing the issue along with your order phone number.
            </p>
          </section>

          {/* Section 3: Replacement Process */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">3</span>
              Replacement & Refund Process
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">📦 Free Replacement</h4>
                <p className="text-xs text-slate-600">
                  We will dispatch the correct replacement item immediately at zero additional shipping cost to your address.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">💸 Full Refund</h4>
                <p className="text-xs text-slate-600">
                  If replacement is unavailable or declined, a 100% refund will be processed to your bKash, Nagad, or Bank Account within 2–5 business days.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Non-Eligible Items */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">4</span>
              Non-Refundable Items
            </h2>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li>Individual foils that have been opened, unsealed, or used.</li>
              <li>Products returned without prior notification after the 48-hour window.</li>
              <li>Change of mind after breaking the product factory safety seal.</li>
            </ul>
          </section>

          {/* Section 5: How to Claim */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">How to Initiate a Claim</h2>
            <p>
              Send a quick message with your order phone number and photo/video to:
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-rose-700">
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:underline">💬 WhatsApp: 01600-905774 (Instant Support)</a>
              <a href="mailto:support@surokkha.shop" className="hover:underline">📧 support@surokkha.shop</a>
              <a href="tel:+8801600905774" className="hover:underline">📞 Phone: 01600-905774</a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
