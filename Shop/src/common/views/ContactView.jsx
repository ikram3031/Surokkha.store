import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SITE_CONFIG } from '../config/siteConfig';

export default function ContactView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const showToast = useStore((state) => state.showToast);

  const isShop = Boolean(SITE_CONFIG?.isShop || (typeof window !== 'undefined' && window.location.hostname.includes('shop')));
  const facebookUrl = SITE_CONFIG?.facebookUrl || (isShop ? 'https://www.facebook.com/surokkha.store.bd' : 'https://facebook.com/surokkha.store');
  const instagramUrl = SITE_CONFIG?.instagramUrl || (isShop ? 'https://instagram.com/surokkha.shop' : 'https://instagram.com/surokkha.store');
  const facebookHandle = isShop ? 'facebook.com/surokkha.store.bd' : 'facebook.com/surokkha.store';
  const instagramHandle = isShop ? 'instagram.com/surokkha.shop' : 'instagram.com/surokkha.store';
  const supportEmail = SITE_CONFIG?.supportEmail || (isShop ? 'support@surokkha.shop' : 'support@surokkha.store');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      showToast('Please fill in your Name, Phone, and Message.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      showToast('Your message has been received! Our support team will contact you shortly.');
    }, 800);
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      'Hello Surokkha Support,\n\nName: ' + (formData.name || 'Customer') +
      '\nPhone: ' + (formData.phone || 'N/A') +
      '\nSubject: ' + (formData.subject || 'General Inquiry') +
      '\nMessage: ' + (formData.message || 'I have a question about Surokkha products.')
    );
    window.open('https://wa.me/8801600905774?text=' + text, '_blank');
  };

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
            <span className="text-amber-300">Contact Us</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <span>📞</span> 100% Confidential Support
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Contact & Support
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-rose-100/70 max-w-xl mx-auto">
            We are here to assist you with order inquiries, product guidance, and confidential delivery support.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Direct Contact Channels (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* WhatsApp Card */}
            <a
              href="https://wa.me/8801600905774"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  💬
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Fastest Response</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">WhatsApp Support</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Instant chat assistance & confidential inquiries</p>
                  <p className="text-xs font-bold text-slate-800 mt-2 font-mono">01600-905774</p>
                </div>
              </div>
            </a>

            {/* Phone Card */}
            <a
              href="tel:+8801600905774"
              className="block p-5 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  📞
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Helpline</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">Direct Phone Line</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Available 10:00 AM – 10:00 PM (Daily)</p>
                  <p className="text-xs font-bold text-slate-800 mt-2 font-mono">01600-905774</p>
                </div>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${supportEmail}`}
              className="block p-5 rounded-2xl bg-white border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  ✉️
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Email Inquiry</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">Customer Support</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Replies within 12 business hours</p>
                  <p className="text-xs font-bold text-slate-800 mt-2">{supportEmail}</p>
                </div>
              </div>
            </a>

            {/* Social Media Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">Official Social Media</h4>
              <div className="space-y-2 text-xs">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-white/90 hover:text-white transition group"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#1877F2]/30 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition">
                    f
                  </span>
                  <span>{facebookHandle}</span>
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-white/90 hover:text-white transition group"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#E4405F]/30 text-[#E4405F] flex items-center justify-center group-hover:bg-[#E4405F] group-hover:text-white transition">
                    📸
                  </span>
                  <span>{instagramHandle}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Confidential Message Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Send a Confidential Message</h2>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Your message is confidential. We will never share your inquiry with third parties.
              </p>

              {submitted ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto">
                    ✓
                  </div>
                  <h3 className="font-bold text-emerald-950 text-base">Message Sent Successfully!</h3>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Thank you for reaching out. Our support agent will contact you via phone or WhatsApp shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
                    }}
                    className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-xs bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mobile Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-xs bg-slate-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-xs bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Delivery Status, Product Query"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Your Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your question or request here..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-xs bg-slate-50/50 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-900 to-rose-800 text-white font-bold text-xs hover:from-rose-800 hover:to-rose-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Message...' : 'Submit Message'}
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppDirect}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs transition border border-[#25D366]/40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>💬</span> Send via WhatsApp
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
