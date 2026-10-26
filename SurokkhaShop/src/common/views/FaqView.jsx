import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function FaqView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const [openIndex, setOpenIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const faqs = [
    {
      category: 'delivery',
      question: 'Is the packaging 100% discreet? Will anyone know what is inside?',
      answer: 'Yes, absolutely! Every order is dispatched inside a completely plain, unbranded box or opaque poly envelope with zero medical descriptions, product names, or sensitive branding. The courier rider and family members will have zero indication of what is inside.'
    },
    {
      category: 'delivery',
      question: 'How long does delivery take inside and outside Dhaka?',
      answer: 'Inside Dhaka City: Delivered within 24 to 48 hours.\nDhaka Suburbs (Savar, Gazipur, Narayanganj): Delivered within 24 to 72 hours.\nOutside Dhaka (All other districts in Bangladesh): Delivered within 48 to 72 hours via trusted courier.'
    },
    {
      category: 'delivery',
      question: 'What are the delivery charges?',
      answer: 'Delivery charges are calculated based on your location:\n• Inside Dhaka: ৳70\n• Dhaka Suburbs: ৳90\n• Outside Dhaka: ৳120'
    },
    {
      category: 'payment',
      question: 'Can I pay via Cash on Delivery (COD)?',
      answer: 'Yes! We support nationwide Cash on Delivery (COD). You simply pay the exact invoice amount in cash to the delivery person once your confidential parcel arrives.'
    },
    {
      category: 'payment',
      question: 'Do I need to create an account or register to order?',
      answer: 'No registration or password is required. You can complete your order directly in under 30 seconds by simply entering your Name, Mobile Number, and Delivery Address.'
    },
    {
      category: 'products',
      question: 'Are MO products genuine and safety certified?',
      answer: 'Yes! All MO personal healthcare products are 100% authentic, imported in factory-sealed boxes, and comply with international medical device standards (ISO 4074) with 100% electronic pinhole quality testing.'
    },
    {
      category: 'products',
      question: 'What is the difference between MO Ultra Thin, Dotted, and Ribbed?',
      answer: '• Ultra Thin (0.045mm): Engineered for high sensitivity and skin-on-skin feel.\n• Textured Matrix (Dotted): Raised micro-dots for enhanced sensation.\n• Contoured Ridges (Ribbed): Ergonomic ribbed ridges for anatomical grip and fit.\n• Combo Pack: Contains all 3 variants at a special discounted price!'
    },
    {
      category: 'products',
      question: 'How should contraceptive products be stored?',
      answer: 'Store them in a cool, dry place away from direct sunlight, excessive heat, and sharp objects. Avoid storing them in car glove compartments or tight back pockets for extended periods.'
    },
    {
      category: 'returns',
      question: 'What happens if I receive a damaged product?',
      answer: 'If your package is damaged during transit or contains the wrong variant, please contact our support within 24 to 48 hours of delivery with a photo. We will immediately dispatch a free replacement or issue a 100% refund.'
    },
    {
      category: 'returns',
      question: 'Can I cancel or modify my order after placing it?',
      answer: 'Yes, you can cancel or update your order before it is dispatched by sending a quick WhatsApp message to 01600-905774 with your order phone number.'
    }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

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
            <span className="text-amber-300">FAQ</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <span>❓</span> Common Questions & Answers
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-rose-100/70 max-w-xl mx-auto">
            Everything you need to know about discreet packaging, nationwide delivery, products, and ordering.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'delivery', label: '📦 Delivery & Packaging' },
            { id: 'payment', label: '💳 Payment & COD' },
            { id: 'products', label: '🛡️ Quality & Specs' },
            { id: 'returns', label: '🔄 Returns & Help' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(0);
              }}
              className={'px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ' + (
                activeCategory === cat.id
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-rose-50 border border-slate-200'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <span className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-transform duration-200 ' + (
                    isOpen ? 'bg-rose-100 text-rose-700 rotate-180' : 'bg-slate-100 text-slate-600'
                  )}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line mt-1">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-rose-950 to-[#1e0813] text-white text-center space-y-3">
          <h3 className="font-bold text-base text-amber-300">Still have questions?</h3>
          <p className="text-xs text-rose-100/80 max-w-md mx-auto">
            Our confidential support team is available 7 days a week to answer your inquiries with complete discretion.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/8801600905774"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-slate-950 font-bold text-xs hover:bg-[#20ba59] transition shadow-sm"
            >
              <span>💬</span> Chat on WhatsApp
            </a>
            <button
              onClick={() => navigateTo('contact')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/20"
            >
              Contact Support →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
