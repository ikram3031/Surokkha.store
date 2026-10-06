import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MessageCircle, CheckCircle2, ShieldCheck, Truck, Lock, Plus, Minus, ChevronRight } from 'lucide-react';
import { formatPrice, toBengaliNumber, calculateDiscount } from '../utils/formatters';
import { useCartStore } from '../store/useCartStore';
import { buildWhatsAppLink, generateSingleProductOrderMessage } from '../utils/whatsapp';

export const ProductModal = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart, openCart } = useCartStore();
  const [selectedImage, setSelectedImage] = useState(
    product.imageUrl || (Array.isArray(product.images) && product.images[0]) || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);

  const regularPrice = product.regularPrice || product.price || 0;
  const offerPrice = product.offerPrice || product.price || 0;
  const discount = product.discountPercentage > 0
    ? product.discountPercentage
    : calculateDiscount(regularPrice, offerPrice);
  const savings = regularPrice > offerPrice ? (regularPrice - offerPrice) * quantity : 0;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleWhatsAppOrder = () => {
    const message = generateSingleProductOrderMessage(product, quantity);
    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCartAndDrawer = () => {
    addToCart(product, quantity);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      onClose();
      openCart();
    }, 400);
  };

  const specsEntries = product.technicalSpecs && typeof product.technicalSpecs === 'object'
    ? Object.entries(product.technicalSpecs)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]">
        {/* Header Bar with Title and Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {product.category_name || 'সুরক্ষা ক্যাটালগ'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline font-medium">
              {product.brand || 'Original Genuine'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Gallery & Images */}
            <div className="flex flex-col space-y-3">
              {/* Main Image Stage */}
              <div className="relative aspect-square bg-gradient-to-b from-slate-950 to-slate-800 rounded-2xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <ShoppingBag className="w-12 h-12 mb-2" />
                    <span className="text-xs">{product.name}</span>
                  </div>
                )}

                {/* Floating Discount Tag */}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-lg">
                    -{toBengaliNumber(discount)}% ছাড়
                  </div>
                )}

                {/* Stock indicator */}
                <div className="absolute bottom-3 left-3">
                  {product.isOutOfStock ? (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-md font-semibold">
                      স্টক শেষ
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping" />
                      স্টকে অ্যাভেইলেবল
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-slate-950 p-1 transition-all ${
                        selectedImage === img
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Guarantees */}
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center text-emerald-400 font-semibold">
                  <Lock className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                  <span>১০০% গোপনীয় সিল করা আনলেবেলড পার্সেল ডেলিভারি</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Truck className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-slate-400" />
                  <span>ঢাকার ভিতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২-৩ দিনে ডেলিভারি</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-slate-400" />
                  <span>ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)</span>
                </div>
              </div>
            </div>

            {/* Right: Explicit Title, Pricing, Specs & Descriptions */}
            <div className="flex flex-col space-y-4">
              {/* Product Title */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {product.name}
                </h2>
                {product.name_bn && (
                  <p className="text-sm font-semibold text-emerald-400 mt-1">
                    {product.name_bn}
                  </p>
                )}
                {product.packSize && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    প্যাক সাইজ: <span className="text-slate-200 font-medium">{product.packSize}</span>
                  </p>
                )}
              </div>

              {/* Price & Savings Display */}
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/80">
                <div className="flex items-baseline space-x-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {formatPrice(offerPrice * quantity)}
                  </span>
                  {regularPrice > offerPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      {formatPrice(regularPrice * quantity)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {toBengaliNumber(discount)}% ছাড়
                    </span>
                  )}
                </div>

                {savings > 0 && (
                  <p className="text-xs font-semibold text-emerald-400 mt-1">
                    🎉 আপনি সাশ্রয় করছেন {formatPrice(savings)}!
                  </p>
                )}
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center space-x-4">
                <span className="text-xs sm:text-sm font-semibold text-slate-300">পরিমাণ:</span>
                <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center text-slate-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-white">
                    {toBengaliNumber(quantity)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center text-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-1 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <p className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-1">
                    প্রোডাক্ট বিবরণ:
                  </p>
                  <p>{product.description}</p>
                </div>
              )}

              {/* Key Benefits */}
              {Array.isArray(product.benefits) && product.benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    প্রধান সুবিধাসমূহ:
                  </h4>
                  <ul className="space-y-1.5">
                    {product.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start text-xs sm:text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{typeof b === 'object' ? `${b.title}: ${b.description}` : b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Specifications */}
              {specsEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    টেকনিক্যাল স্পেসিফিকেশন:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {specsEntries.map(([key, val], idx) => (
                      <div key={idx} className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                        <span className="text-slate-400 block text-[11px]">{key}</span>
                        <span className="text-slate-200 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Primary Action 1: Direct WhatsApp Order */}
            <button
              onClick={handleWhatsAppOrder}
              disabled={product.isOutOfStock}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-95 text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white fill-white/20" />
              <span>সরাসরি হোয়াটসঅ্যাপে অর্ডার</span>
            </button>

            {/* Primary Action 2: Add to Cart & Open Drawer */}
            <button
              onClick={handleAddToCartAndDrawer}
              disabled={product.isOutOfStock}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
                isAddedFeedback
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-750 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>{isAddedFeedback ? 'কার্টে যোগ করা হয়েছে ✓' : 'কার্টে যোগ করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
