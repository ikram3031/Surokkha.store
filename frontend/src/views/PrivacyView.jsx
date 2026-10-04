import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function PrivacyView() {
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
            <span className="text-amber-300">Privacy Policy</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <span>🔒</span> 100% Confidentiality & Data Protection
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-rose-100/70 max-w-xl mx-auto">
            Your personal privacy and order confidentiality are our highest priority.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">

          {/* Privacy Commitment Banner */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">Our 100% Discretion Guarantee</h3>
              <p className="text-xs text-emerald-800 mt-1">
                We will never disclose, share, or sell your identity, contact information, or purchasing history. All shipments are packaged in unmarked boxes with zero reference to family planning products.
              </p>
            </div>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">1</span>
              Information We Collect
            </h2>
            <p>
              When you place an order or interact with Surokkha.store, we collect only the minimal essential information required to fulfill your order:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong>Contact Information:</strong> Full name, mobile phone number, and optional email address.</li>
              <li><strong>Delivery Coordinates:</strong> Street address, District, and Thana / Upazila for courier dispatch.</li>
              <li><strong>Order Data:</strong> Selected items, order quantity, and optional order delivery notes.</li>
              <li><strong>Technical Data:</strong> Anonymous browsing logs, standard web cookies, and device telemetry to ensure website stability.</li>
            </ul>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">2</span>
              How We Use Your Information
            </h2>
            <p>Your details are used strictly for:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li>Processing and dispatching your confidential order to your destination.</li>
              <li>Sending SMS or WhatsApp delivery tracking updates regarding parcel movement.</li>
              <li>Contacting you if there are address ambiguities or courier routing issues.</li>
              <li>Preventing fraudulent orders and maintaining service integrity.</li>
            </ul>
            <p className="font-semibold text-rose-900">
              We NEVER send unsolicited promotional phone calls or marketing spam.
            </p>
          </section>

          {/* Section 3: Third-Party Courier Discretion */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">3</span>
              Courier Handling & Third-Party Discretion
            </h2>
            <p>
              We partner with trusted nationwide courier services (e.g. Steadfast Courier). To protect your privacy:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Courier waybills display only your Name, Phone Number, and Address alongside a neutral generic merchant identifier.</li>
              <li>No medical descriptions, condom variant names, or brand logos appear on courier invoices.</li>
              <li>Delivery riders are strictly bound to deliver sealed packages without opening or inspecting inner contents.</li>
            </ul>
          </section>

          {/* Section 4: Data Security & Storage */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">4</span>
              Data Security & Retention
            </h2>
            <p>
              We implement industry-standard HTTPS / TLS encryption to protect data in transit. Your customer records are stored securely behind enterprise firewall infrastructure with restricted administrative access. We retain transaction data only as long as necessary for tax compliance and accounting auditing.
            </p>
          </section>

          {/* Section 5: Your Privacy Rights */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">5</span>
              Your Data Rights & Deletion Requests
            </h2>
            <p>
              You have the full right to request deletion of your order records, phone number, and address from our database once your delivery has been successfully completed. Simply contact our support team with your order reference or mobile number.
            </p>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Privacy Support</h2>
            <p>
              For any questions or data deletion requests regarding your personal information, reach out to:
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-rose-700">
              <a href="mailto:support@surokkha.store" className="hover:underline">📧 support@surokkha.store</a>
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:underline">💬 WhatsApp: 01600-905774</a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
