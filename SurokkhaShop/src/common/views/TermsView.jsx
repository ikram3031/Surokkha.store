import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function TermsView() {
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
            <span className="text-amber-300">Terms & Conditions</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <span>⚖️</span> Legal & Service Terms
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-rose-100/70 max-w-xl mx-auto">
            Please read these terms carefully before using or placing orders on Surokkha.shop.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">

          {/* Last Updated */}
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between text-xs text-rose-900">
            <span><strong>Effective Date:</strong> October 2026</span>
            <span className="font-medium text-rose-700">Version 2.4</span>
          </div>

          {/* Section 1: Age Requirement */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">1</span>
              18+ Age Restriction & Family Planning Purpose
            </h2>
            <p>
              By accessing Surokkha.shop and placing an order, you explicitly confirm that you are at least <strong>18 years of age</strong> (or the legal age of majority in your jurisdiction). Our products are strictly intended for legal adults and married couples for family planning and reproductive health protection.
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Minors under the age of 18 are prohibited from purchasing contraceptive devices and adult healthcare products from this platform.
            </p>
          </section>

          {/* Section 2: Product Authenticity & Standards */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">2</span>
              Product Authenticity & Quality Compliance
            </h2>
            <p>
              All products listed on Surokkha.shop are 100% authentic, brand-new, and sealed in original manufacturer packaging. Each batch undergoes rigorous 100% electronic pinhole testing and complies with international medical standard ISO 4074.
            </p>
            <p>
              While barrier contraceptive products are highly effective at reducing the risk of unintended pregnancy and transmission of Sexually Transmitted Infections (STIs), no barrier contraceptive method can guarantee 100% effectiveness. Always follow the enclosed usage instructions.
            </p>
          </section>

          {/* Section 3: Orders, Pricing & Delivery */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">3</span>
              Orders, Pricing & Nationwide Delivery
            </h2>
            <p>
              All prices are displayed in Bangladeshi Taka (BDT ৳) and are inclusive of applicable taxes unless specified otherwise. We reserve the right to correct any typographical pricing errors.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Inside Dhaka:</strong> Delivery within 24 to 48 hours (৳70).</li>
              <li><strong>Dhaka Suburbs (Savar, Gazipur, Narayanganj):</strong> Delivery within 24 to 72 hours (৳90).</li>
              <li><strong>Outside Dhaka (Nationwide):</strong> Delivery within 48 to 72 hours (৳120).</li>
              <li><strong>Free Delivery Offer:</strong> Orders of ৳1,000 or above automatically qualify for free delivery.</li>
            </ul>
          </section>

          {/* Section 4: 100% Discreet Packaging Policy */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">4</span>
              100% Discreet & Confidential Packaging Guarantee
            </h2>
            <p>
              We respect your utmost privacy. Every parcel dispatched by Surokkha.shop is packed inside a completely plain, unbranded outer cardboard box or opaque poly envelope.
            </p>
            <p>
              <strong>Zero Identifying Marks:</strong> No product names, medical classifications, brand names, or logos appear anywhere on the external shipping label. The courier rider and any third party will have zero knowledge of the contents.
            </p>
          </section>

          {/* Section 5: Payment Terms (Cash on Delivery) */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">5</span>
              Cash on Delivery (COD) & Payment Obligations
            </h2>
            <p>
              We provide convenient Cash on Delivery (COD) nationwide across Bangladesh. By placing a COD order, you agree to receive the parcel at the designated delivery address and pay the exact invoice amount in cash to the courier representative.
            </p>
            <p>
              Repeated intentional order rejections upon arrival without valid reason cause significant financial loss and may lead to blacklisting of phone numbers and delivery addresses across partner courier networks.
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">6</span>
              Limitation of Liability & Medical Advice
            </h2>
            <p>
              The information provided on Surokkha.shop is for informational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Surokkha.shop shall not be liable for any indirect, incidental, or consequential damages resulting from improper product usage or failure to follow product package guidelines.
            </p>
          </section>

          {/* Section 7: Contact for Legal Inquiries */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Questions or Concerns?</h2>
            <p>
              If you have any questions regarding these Terms & Conditions, please contact us at:
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-rose-700">
              <a href="mailto:support@surokkha.shop" className="hover:underline">📧 support@surokkha.shop</a>
              <a href="tel:+8801600905774" className="hover:underline">📞 +880 1600-905774</a>
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:underline">💬 WhatsApp: 01600-905774</a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
