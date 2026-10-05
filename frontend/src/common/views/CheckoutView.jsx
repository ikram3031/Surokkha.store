import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DISTRICTS, DISTRICT_THANAS } from '../data/districts';
import { trackInitiateCheckout, trackAddPaymentInfo } from '../utils/analytics';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';

export default function CheckoutView() {
  const { t, isBn } = useTranslation();
  const cart = useStore((state) => state.cart);
  const products = useStore((state) => state.products);
  const navigateTo = useStore((state) => state.navigateTo);
  const openCartDrawer = useStore((state) => state.openCartDrawer);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const submitOrder = useStore((state) => state.submitOrder);
  const showToast = useStore((state) => state.showToast);

  const shippingInfo = useStore((state) => state.shippingInfo);
  const setShippingInfo = useStore((state) => state.setShippingInfo);
  const shippingAddress = useStore((state) => state.shippingAddress);
  const setShippingAddress = useStore((state) => state.setShippingAddress);
  const sameAsBilling = useStore((state) => state.sameAsBilling);
  const setSameAsBilling = useStore((state) => state.setSameAsBilling);
  const orderNotes = useStore((state) => state.orderNotes);
  const setOrderNotes = useStore((state) => state.setOrderNotes);

  const storeAppliedCoupon = useStore((state) => state.appliedCoupon);
  const couponCodeInput = useStore((state) => state.couponCodeInput);
  const setCouponCodeInput = useStore((state) => state.setCouponCodeInput);
  const couponError = useStore((state) => state.couponError);
  const isApplyingCoupon = useStore((state) => state.isApplyingCoupon);
  const applyCoupon = useStore((state) => state.applyCoupon);
  const removeCoupon = useStore((state) => state.removeCoupon);

  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isShipDistrictOpen, setIsShipDistrictOpen] = useState(false);
  const [isThanaOpen, setIsThanaOpen] = useState(false);
  const [isShipThanaOpen, setIsShipThanaOpen] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [shipPhoneError, setShipPhoneError] = useState('');

  const totals = getCartTotals();
  const appliedCoupon = totals.appliedCoupon || storeAppliedCoupon;
  const cartKeys = Object.keys(cart).filter((k) => cart[k] > 0);

  const freeDeliveryThreshold = 1000;
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeDeliveryThreshold) * 100));
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - totals.subtotal);
  const isFreeDeliveryUnlocked = totals.subtotal >= freeDeliveryThreshold || totals.isFreeShippingCoupon;

  const formatPrice = (val) => {
    const num = Number(val) || 0;
    if (isBn) {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return '৳' + String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
    }
    return `৳${num}`;
  };

  useEffect(() => {
    if (totals.itemCount > 0) {
      trackInitiateCheckout(cart, products, totals);
      trackAddPaymentInfo('Cash on Delivery', totals, cartKeys);
    }
  }, []);

  // Sync shippingAddress initial fields if sameAsBilling is toggled
  useEffect(() => {
    if (!sameAsBilling) {
      if (!shippingAddress.fullName && shippingInfo.fullName) {
        setShippingAddress({
          fullName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          thana: shippingInfo.thana,
          district: shippingInfo.district,
          zip: shippingInfo.zip
        });
      }
    }
  }, [sameAsBilling]);

  useEffect(() => {
    if (totals.itemCount === 0) {
      navigateTo('home');
      openCartDrawer();
    }
  }, [totals.itemCount, navigateTo, openCartDrawer]);

  if (totals.itemCount === 0) {
    return null;
  }

  const convertBnToEnDigits = (str) => {
    if (!str) return '';
    const bnToEn = { '০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9' };
    return String(str).replace(/[০-৯]/g, (char) => bnToEn[char] || char);
  };

  const validateEmail = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return t('checkout.error_email_required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? '' : t('checkout.error_email_invalid');
  };

  const normalizePhoneValue = (value) => {
    let raw = convertBnToEnDigits(value || '').trim();
    if (!raw) return '';
    // Strip spaces, dashes, brackets
    raw = raw.replace(/[\s\-\(\)]/g, '');
    const hasPlus = raw.startsWith('+');
    const digits = raw.replace(/[^\d]/g, '');

    if (digits.startsWith('8801') && digits.length >= 13) {
      return '+880' + digits.slice(3, 13);
    }
    if (digits.startsWith('01') && digits.length >= 11) {
      return '+88' + digits.slice(0, 11);
    }
    if (digits.startsWith('1') && digits.length === 10) {
      return '+880' + digits;
    }
    if (hasPlus) {
      return '+' + digits;
    }
    return digits;
  };

  const validatePhoneValue = (value) => {
    if (!value || !value.trim()) return t('checkout.error_phone_required');
    const normalized = normalizePhoneValue(value);
    const phoneRegex = /^\+8801[3-9]\d{8}$/;
    if (!phoneRegex.test(normalized)) {
      return t('checkout.error_phone_invalid');
    }
    return '';
  };

  const checkFakePhone = async (phoneToCheck) => {
    const raw = convertBnToEnDigits(phoneToCheck || '').trim();
    const digits = raw.replace(/\D/g, '');
    const corePhone = digits.length >= 10 ? digits.slice(-10) : digits;
    if (corePhone.length < 10) return;

    try {
      const cleanBase = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch(`${cleanBase}/api/v1/orders/check-phone?phone=${encodeURIComponent(corePhone)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.isFake) {
          const fakeMsg = isBn 
            ? 'অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন।' 
            : 'Please use a different valid phone number.';
          setPhoneError(fakeMsg);
        }
      }
    } catch (_) {}
  };

  const handleBillingPhoneChange = (value) => {
    const cleaned = convertBnToEnDigits(value);
    setShippingInfo({ phone: cleaned });
    if (cleaned.trim()) {
      const err = validatePhoneValue(cleaned);
      setPhoneError(err);
      if (!err) {
        checkFakePhone(cleaned);
      }
    } else {
      setPhoneError('');
    }
  };

  const handleShippingPhoneChange = (value) => {
    const cleaned = convertBnToEnDigits(value);
    setShippingAddress({ phone: cleaned });
    if (cleaned.trim()) {
      const err = validatePhoneValue(cleaned);
      setShipPhoneError(err);
      if (!err) {
        checkFakePhone(cleaned);
      }
    } else {
      setShipPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let billingPh = shippingInfo.phone || '';
    let shipPh = shippingAddress.phone || '';

    // If shipping to different address and one phone is filled, seamlessly sync if the other is empty
    if (!sameAsBilling) {
      if (!billingPh.trim() && shipPh.trim()) {
        billingPh = shipPh;
        setShippingInfo({ phone: shipPh });
      }
      if (!shippingInfo.fullName?.trim() && shippingAddress.fullName?.trim()) {
        setShippingInfo({ fullName: shippingAddress.fullName });
      }
      if (!shippingInfo.address?.trim() && shippingAddress.address?.trim()) {
        setShippingInfo({ address: shippingAddress.address });
      }
      if (!shippingInfo.district?.trim() && shippingAddress.district?.trim()) {
        setShippingInfo({ district: shippingAddress.district });
      }
      if (!shippingInfo.thana?.trim() && shippingAddress.thana?.trim()) {
        setShippingInfo({ thana: shippingAddress.thana });
      }
    }

    const emailErr = validateEmail(shippingInfo.email);
    const phErr = validatePhoneValue(billingPh);
    const shipPhErr = !sameAsBilling ? validatePhoneValue(shipPh) : '';
    
    const billingDistrict = (shippingInfo.district || shippingAddress.district || '').trim();
    const billingThana = (shippingInfo.thana || shippingAddress.thana || '').trim();
    const shippingDistrict = (shippingAddress.district || '').trim();
    const shippingThana = (shippingAddress.thana || '').trim();

    setEmailError(emailErr);
    setPhoneError(phErr);
    setShipPhoneError(shipPhErr);

    if (!agreedToTerms) {
      showToast(t('checkout.error_agree_terms'));
      return;
    }

    if (!shippingInfo.fullName?.trim() && !shippingAddress.fullName?.trim()) {
      showToast(t('checkout.error_missing_billing'));
      return;
    }

    if (emailErr) {
      showToast(t('checkout.error_email_invalid'));
      return;
    }

    if (phErr) {
      showToast(t('checkout.error_phone_invalid'));
      return;
    }

    const subDistricts = ['dhaka', 'gazipur', 'narayanganj'];
    if (subDistricts.includes(billingDistrict.toLowerCase()) && !billingThana) {
      showToast(t('checkout.error_thana_required'));
      return;
    }

    // Conditional Shipping Validation when shipToDifferentAddress is true
    if (!sameAsBilling) {
      if (!shippingAddress.fullName?.trim() || !shippingAddress.address?.trim() || !shippingDistrict) {
        showToast(t('checkout.error_missing_shipping'));
        return;
      }

      if (shipPhErr) {
        showToast(t('checkout.error_ship_phone_invalid'));
        return;
      }

      if (subDistricts.includes(shippingDistrict.toLowerCase()) && !shippingThana) {
        showToast(t('checkout.error_ship_thana_required'));
        return;
      }
    }

    setIsProcessing(true);

    try {
      await submitOrder();
    } catch (err) {
      setIsProcessing(false);
      const rawMsg = err?.message || '';
      let userMsg = t('checkout.error_order_failed');
      if (rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror')) {
        userMsg = t('checkout.error_network');
      } else if (rawMsg) {
        userMsg = rawMsg;
      }
      showToast(userMsg);
    }
  };

  const activeDistrict = (sameAsBilling ? (shippingInfo.district || '') : (shippingAddress.district || '')).trim().toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <button 
            type="button" 
            onClick={openCartDrawer}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-rose-50 border border-slate-300 hover:border-brand-500 hover:text-brand-800 px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {t('checkout.back_to_cart')}
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 mt-1">{t('checkout.title')}</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
          {t('checkout.subtitle')}
        </p>
      </div>

      {/* Free Delivery Threshold Progress Banner (Matching Cart Drawer & Image) */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-emerald-950">
            <span className="text-base sm:text-lg">🚚</span>
            {isFreeDeliveryUnlocked ? (
              <span className="text-emerald-900 font-black">
                {isBn 
                  ? '🎉 অভিনন্দন! আপনি ফ্রি হোম ডেলিভারি পাচ্ছেন! (FREEOCT স্বয়ংক্রিয়ভাবে প্রয়োগ করা হয়েছে)' 
                  : '🎉 Congratulations! You unlocked Free Home Delivery! (FREEOCT auto-applied)'}
              </span>
            ) : (
              <span>
                {isBn ? (
                  <>
                    আর মাত্র <strong className="text-emerald-950 underline font-black">{formatPrice(remainingForFreeDelivery)}</strong> টাকার পণ্য যোগ করলেই <strong className="text-emerald-950">ফ্রি ডেলিভারি!</strong>
                  </>
                ) : (
                  <>
                    Add <strong className="text-emerald-950 font-black">{formatPrice(remainingForFreeDelivery)}</strong> more to get <strong className="text-emerald-950">Free Delivery!</strong>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-emerald-800 text-xs sm:text-sm font-mono bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
              {progressPercent}%
            </span>
            {!isFreeDeliveryUnlocked && (
              <button
                type="button"
                onClick={openCartDrawer}
                className="hidden sm:inline-flex text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
              >
                + {isBn ? 'পণ্য যোগ করুন' : 'Add Items'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-emerald-200/80 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Billing Address & Conditional Shipping Address */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Billing Address Card */}
            <div className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 relative transition-all ${isDistrictOpen || isThanaOpen ? 'z-30' : 'z-10'}`}>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider">
                    {t('checkout.billing_title')}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {t('checkout.fields_required_note')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md">{t('checkout.step1')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="billingFullName">
                    {t('checkout.full_name')} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="billingFullName"
                    required 
                    value={shippingInfo.fullName || ''}
                    onChange={(e) => setShippingInfo({ fullName: e.target.value })}
                    placeholder={t('checkout.full_name_placeholder')} 
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition" 
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="billingEmail">
                    {t('checkout.email_address')} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="billingEmail"
                    required 
                    value={shippingInfo.email || ''}
                    onChange={(e) => {
                      setShippingInfo({ email: e.target.value });
                      setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                    placeholder={t('checkout.email_placeholder')} 
                    className={`w-full text-xs sm:text-sm bg-slate-50 border ${emailError ? 'border-rose-500' : 'border-slate-300'} rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition`} 
                  />
                  {emailError && <p className="mt-1 text-[10px] text-rose-500 font-semibold">{emailError}</p>}
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="billingPhone">
                    {t('checkout.mobile_phone')} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    id="billingPhone"
                    required 
                    value={shippingInfo.phone || ''}
                    onChange={(e) => handleBillingPhoneChange(e.target.value)}
                    onBlur={(e) => setPhoneError(validatePhoneValue(e.target.value))}
                    placeholder={t('checkout.mobile_placeholder', '01XXXXXXXXX (যেমন: 01712345678)')} 
                    className={`w-full text-xs sm:text-sm bg-slate-50 border ${phoneError ? 'border-rose-500' : 'border-slate-300'} rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition font-mono`} 
                  />
                  {phoneError && <p className="mt-1 text-[10px] text-rose-500 font-semibold">{phoneError}</p>}
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="billingAddress">
                    {t('checkout.street_address')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    id="billingAddress" 
                    required 
                    rows={2} 
                    value={shippingInfo.address || ''}
                    onChange={(e) => setShippingInfo({ address: e.target.value })}
                    placeholder={t('checkout.street_placeholder')} 
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition resize-y"
                  />
                </div>

                {/* District Searchable Dropdown */}
                <div className={`relative ${isDistrictOpen ? 'z-50' : 'z-20'}`}>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="billingDistrict">
                    {t('checkout.district')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="billingDistrict"
                      required
                      placeholder={t('checkout.district_placeholder')}
                      value={shippingInfo.district || ''}
                      onFocus={() => setIsDistrictOpen(true)}
                      onBlur={() => setTimeout(() => setIsDistrictOpen(false), 200)}
                      onChange={(e) => {
                        setShippingInfo({ district: e.target.value, thana: '' });
                        setIsDistrictOpen(true);
                      }}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition pr-10 cursor-pointer"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {shippingInfo.district ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShippingInfo({ district: '', thana: '' });
                            setIsDistrictOpen(true);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                          title={t('checkout.clear_district')}
                          aria-label={t('checkout.clear_district')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : (
                        <div className="pointer-events-none text-slate-400 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {isDistrictOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl z-[9999] py-1 shadow-2xl divide-y divide-slate-100 scrollbar-thin ring-1 ring-black/10">
                      {[...DISTRICTS]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter(d => d.name.toLowerCase().includes((shippingInfo.district || '').toLowerCase()))
                        .map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShippingInfo({ district: d.name, thana: '' });
                              setIsDistrictOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 bg-white text-slate-700 hover:text-brand-900 hover:bg-brand-50 text-xs transition cursor-pointer"
                          >
                            {d.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Thana Searchable Dropdown */}
                <div className={`relative ${isThanaOpen ? 'z-50' : 'z-20'}`}>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="billingThana">
                    {t('checkout.thana')} {['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district) && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="billingThana"
                      required={['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district)}
                      placeholder={['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district) ? t('checkout.thana_placeholder_select') : t('checkout.thana_placeholder_enter')}
                      value={shippingInfo.thana || ''}
                      onFocus={() => {
                        if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district)) {
                          setIsThanaOpen(true);
                        }
                      }}
                      onBlur={() => setTimeout(() => setIsThanaOpen(false), 200)}
                      onChange={(e) => {
                        setShippingInfo({ thana: e.target.value });
                        if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district)) {
                          setIsThanaOpen(true);
                        }
                      }}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition pr-10"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {shippingInfo.thana ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShippingInfo({ thana: '' });
                            if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district)) {
                              setIsThanaOpen(true);
                            }
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                          title={t('checkout.clear_thana')}
                          aria-label={t('checkout.clear_thana')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : ['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district) ? (
                        <div className="pointer-events-none text-slate-400 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isThanaOpen && ['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingInfo.district) && (
                    <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl z-[9999] py-1 shadow-2xl divide-y divide-slate-100 scrollbar-thin ring-1 ring-black/10">
                      {(DISTRICT_THANAS[shippingInfo.district] || [])
                        .filter(tItem => tItem.name.toLowerCase().includes((shippingInfo.thana || '').toLowerCase()))
                        .map((tItem) => (
                          <button
                            key={tItem.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShippingInfo({ thana: tItem.name });
                              setIsThanaOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 bg-white text-slate-700 hover:text-brand-900 hover:bg-brand-50 text-xs transition cursor-pointer"
                          >
                            {tItem.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ship to a different address toggle */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3 text-xs text-slate-800 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!sameAsBilling}
                    onChange={(e) => setSameAsBilling(!e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-brand-700 focus:ring-brand-700 accent-brand-700 cursor-pointer"
                  />
                  <span className="font-bold text-brand-900 uppercase tracking-wider text-xs">
                    {t('checkout.ship_to_different')}
                  </span>
                </label>
              </div>

            </div>

            {/* Conditional Shipping Address Section */}
            {!sameAsBilling && (
              <div className={`bg-brand-50/40 border-2 border-brand-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-fade-in relative transition-all ${isShipDistrictOpen || isShipThanaOpen ? 'z-30' : 'z-10'}`}>
                <div className="border-b border-brand-200/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-brand-950 uppercase tracking-wider flex items-center gap-2">
                      <span>🚚</span> {t('checkout.recipient_title')}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('checkout.recipient_desc')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">{t('checkout.mandatory_recipient')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Recipient Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="shipFullName">
                      {t('checkout.recipient_name')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="shipFullName"
                      required={!sameAsBilling}
                      value={shippingAddress.fullName || ''}
                      onChange={(e) => setShippingAddress({ fullName: e.target.value })}
                      placeholder={t('checkout.recipient_name_placeholder')} 
                      className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition" 
                    />
                  </div>

                  {/* Recipient Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="shipPhone">
                      {t('checkout.recipient_phone')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      id="shipPhone"
                      required={!sameAsBilling}
                      value={shippingAddress.phone || ''}
                      onChange={(e) => handleShippingPhoneChange(e.target.value)}
                      onBlur={(e) => setShipPhoneError(validatePhoneValue(e.target.value))}
                      placeholder={t('checkout.mobile_placeholder', '01XXXXXXXXX (যেমন: 01712345678)')} 
                      className={`w-full text-xs sm:text-sm bg-white border ${shipPhoneError ? 'border-rose-500' : 'border-slate-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition font-mono`} 
                    />
                    {shipPhoneError && <p className="mt-1 text-[10px] text-rose-500 font-semibold">{shipPhoneError}</p>}
                  </div>

                  {/* Shipping Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="shipAddress">
                      {t('checkout.shipping_street_address')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      id="shipAddress" 
                      required={!sameAsBilling}
                      rows={2} 
                      value={shippingAddress.address || ''}
                      onChange={(e) => setShippingAddress({ address: e.target.value })}
                      placeholder={t('checkout.shipping_street_placeholder')} 
                      className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition resize-y"
                    />
                  </div>

                  {/* Shipping District */}
                  <div className={`relative ${isShipDistrictOpen ? 'z-50' : 'z-20'}`}>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="shipDistrict">
                      {t('checkout.shipping_district')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="shipDistrict"
                        required={!sameAsBilling}
                        placeholder={t('checkout.shipping_district_placeholder')}
                        value={shippingAddress.district || ''}
                        onFocus={() => setIsShipDistrictOpen(true)}
                        onBlur={() => setTimeout(() => setIsShipDistrictOpen(false), 200)}
                        onChange={(e) => {
                          setShippingAddress({ district: e.target.value, thana: '' });
                          setIsShipDistrictOpen(true);
                        }}
                        className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition pr-10 cursor-pointer"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {shippingAddress.district ? (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShippingAddress({ district: '', thana: '' });
                              setIsShipDistrictOpen(true);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                            title={t('checkout.clear_district')}
                            aria-label={t('checkout.clear_district')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ) : (
                          <div className="pointer-events-none text-slate-400 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {isShipDistrictOpen && (
                      <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl z-[9999] py-1 shadow-2xl divide-y divide-slate-100 scrollbar-thin ring-1 ring-black/10">
                        {[...DISTRICTS]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .filter(d => d.name.toLowerCase().includes((shippingAddress.district || '').toLowerCase()))
                          .map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setShippingAddress({ district: d.name, thana: '' });
                                setIsShipDistrictOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 bg-white text-slate-700 hover:text-brand-900 hover:bg-brand-50 text-xs transition cursor-pointer"
                            >
                              {d.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Shipping Thana */}
                  <div className={`relative ${isShipThanaOpen ? 'z-50' : 'z-20'}`}>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="shipThana">
                      {t('checkout.shipping_thana')} {['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district) && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="shipThana"
                        required={!sameAsBilling && ['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district)}
                        placeholder={['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district) ? t('checkout.thana_placeholder_select') : t('checkout.thana_placeholder_enter')}
                        value={shippingAddress.thana || ''}
                        onFocus={() => {
                          if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district)) {
                            setIsShipThanaOpen(true);
                          }
                        }}
                        onBlur={() => setTimeout(() => setIsShipThanaOpen(false), 200)}
                        onChange={(e) => {
                          setShippingAddress({ thana: e.target.value });
                          if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district)) {
                            setIsShipThanaOpen(true);
                          }
                        }}
                        className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition pr-10"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {shippingAddress.thana ? (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShippingAddress({ thana: '' });
                              if (['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district)) {
                                setIsShipThanaOpen(true);
                              }
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                            title={t('checkout.clear_thana')}
                            aria-label={t('checkout.clear_thana')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ) : ['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district) ? (
                          <div className="pointer-events-none text-slate-400 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {isShipThanaOpen && ['Dhaka', 'Gazipur', 'Narayanganj'].includes(shippingAddress.district) && (
                      <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl z-[9999] py-1 shadow-2xl divide-y divide-slate-100 scrollbar-thin ring-1 ring-black/10">
                        {(DISTRICT_THANAS[shippingAddress.district] || [])
                          .filter(tItem => tItem.name.toLowerCase().includes((shippingAddress.thana || '').toLowerCase()))
                          .map((tItem) => (
                            <button
                              key={tItem.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setShippingAddress({ thana: tItem.name });
                                setIsShipThanaOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 bg-white text-slate-700 hover:text-brand-900 hover:bg-brand-50 text-xs transition cursor-pointer"
                            >
                              {tItem.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Charge Tier Info (Auto calculated based on active location) */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-3xl p-6 space-y-3 relative z-0">
              <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <h4 className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📦</span> {t('checkout.delivery_tier_title')}
                </h4>
                <span className="text-[11px] text-slate-500">{t('checkout.auto_calculated')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tier 1: Inside Dhaka */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  (totals.originalDeliveryFee ?? totals.deliveryFee) === 70
                    ? 'border-brand-700 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-400 opacity-60'
                }`}>
                  <div>
                    <span className="text-xs font-bold block">{t('checkout.inside_dhaka')}</span>
                    <span className="text-[10px] text-slate-500">{t('checkout.inside_dhaka_time')}</span>
                  </div>
                  {totals.isFreeShippingCoupon && (totals.originalDeliveryFee ?? totals.deliveryFee) === 70 ? (
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      <span className="line-through text-slate-400 font-normal text-[10px] mr-1">৳70</span>
                      {isBn ? 'ফ্রি' : 'FREE'}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-brand-800">৳70</span>
                  )}
                </div>

                {/* Tier 2: Dhaka Suburbs */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  (totals.originalDeliveryFee ?? totals.deliveryFee) === 90
                    ? 'border-brand-700 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-400 opacity-60'
                }`}>
                  <div>
                    <span className="text-xs font-bold block">{t('checkout.dhaka_suburbs')}</span>
                    <span className="text-[10px] text-slate-500">{t('checkout.dhaka_suburbs_time')}</span>
                  </div>
                  {totals.isFreeShippingCoupon && (totals.originalDeliveryFee ?? totals.deliveryFee) === 90 ? (
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      <span className="line-through text-slate-400 font-normal text-[10px] mr-1">৳90</span>
                      {isBn ? 'ফ্রি' : 'FREE'}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-brand-800">৳90</span>
                  )}
                </div>

                {/* Tier 3: Outside Dhaka */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  (totals.originalDeliveryFee ?? totals.deliveryFee) === 120
                    ? 'border-brand-700 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-400 opacity-60'
                }`}>
                  <div>
                    <span className="text-xs font-bold block">{t('checkout.outside_dhaka')}</span>
                    <span className="text-[10px] text-slate-500">{t('checkout.outside_dhaka_time')}</span>
                  </div>
                  {totals.isFreeShippingCoupon && (totals.originalDeliveryFee ?? totals.deliveryFee) === 120 ? (
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      <span className="line-through text-slate-400 font-normal text-[10px] mr-1">৳120</span>
                      {isBn ? 'ফ্রি' : 'FREE'}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-brand-800">৳120</span>
                  )}
                </div>
              </div>
            </div>

            {/* Order Notes Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2">
              <label className="block text-xs font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between" htmlFor="orderNotes">
                <span className="flex items-center gap-1.5">
                  <span>📝</span> {t('checkout.order_notes')}
                </span>
                <span className="text-slate-400 font-normal lowercase text-[10px]">{t('checkout.optional')}</span>
              </label>
              <textarea
                id="orderNotes"
                rows={2}
                value={orderNotes || ''}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={t('checkout.notes_placeholder')}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition resize-y"
              />
            </div>

          </div>

          {/* Right Column: Payment Method & Order Summary Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Payment Method Card - COD Only */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider">
                  {t('checkout.payment_method')}
                </h3>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">{t('checkout.verified')}</span>
              </div>

              {/* Cash on Delivery Selection */}
              <div className="border-2 border-brand-700 bg-brand-50/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-800 text-white flex items-center justify-center text-xs font-bold">✓</div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">{t('checkout.cod')}</span>
                    <span className="text-[11px] text-slate-500">{t('checkout.cod_desc')}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-900 bg-brand-100 px-2 py-0.5 rounded">{t('checkout.primary')}</span>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider">{t('checkout.order_items', { n: totals.itemCount })}</h3>
                <button 
                  type="button"
                  onClick={openCartDrawer} 
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-800 bg-white hover:bg-rose-50 border border-slate-300 hover:border-brand-500 hover:text-brand-800 px-3 py-1 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <svg className="w-3 h-3 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>{t('checkout.edit_cart')}</span>
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cartKeys.map((slug) => {
                  const item = products[slug] || { name: slug, price: 400 };
                  const qty = cart[slug];
                  return (
                    <div key={slug} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-slate-600 font-bold">× {qty}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="font-bold text-slate-900">৳{item.price * qty}</span>
                        {item.regularPrice > item.price && (
                          <span className="text-[11px] text-slate-500 line-through">৳{item.regularPrice * qty}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo / Coupon Code Section */}
              <div className="border-t border-slate-200/90 pt-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>{t('checkout.coupon_label', 'কুপন কোড / Promo Code')}</span>
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✓ {appliedCoupon.discountType === 'free_shipping' 
                          ? (isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery')
                          : (appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% OFF` 
                              : `৳${appliedCoupon.discountValue} OFF`)}
                      {appliedCoupon.isAutoApplied && (
                        <span className="text-[9px] bg-emerald-200 text-emerald-950 font-bold px-1 rounded ml-0.5">
                          {isBn ? 'স্বয়ংক্রিয়' : 'Auto'}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-300 rounded-xl px-3 py-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {appliedCoupon.discountType === 'free_shipping'
                          ? `(${isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'})`
                          : `(-৳${totals.discountAmount})`}
                      </span>
                      {appliedCoupon.isAutoApplied && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                          {isBn ? 'স্বয়ংক্রিয় প্রয়োগ' : 'Auto-Applied'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 px-2 py-0.5 rounded-md transition cursor-pointer"
                    >
                      {t('checkout.remove_coupon', 'মুছুন')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder={t('checkout.coupon_placeholder', 'কুপন কোড লিখুন')}
                        className="flex-1 text-xs uppercase font-mono tracking-wider bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700 transition"
                      />
                      <button
                        type="button"
                        disabled={isApplyingCoupon || !couponCodeInput.trim()}
                        onClick={() => applyCoupon()}
                        className="bg-slate-900 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                      >
                        {isApplyingCoupon ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>{t('checkout.apply_coupon', 'প্রয়োগ করুন')}</span>
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-semibold pl-1">
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>{t('checkout.subtotal')}</span>
                  <span className="font-bold text-slate-900 font-mono">৳{totals.subtotal}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>{t('checkout.coupon_discount', 'কুপন ডিসকাউন্ট')} {appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}</span>
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">-৳{totals.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-medium">
                  <span>{t('checkout.delivery_charge', { area: activeDistrict ? activeDistrict.toUpperCase() : 'STANDARD' })}</span>
                  {totals.isFreeShippingCoupon ? (
                    <span className="font-bold text-emerald-700 font-mono flex items-center gap-1">
                      <span className="line-through text-slate-400 font-normal text-[11px]">৳{totals.originalDeliveryFee}</span>
                      <span>{isBn ? 'ফ্রি' : 'FREE'}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900 font-mono">৳{totals.deliveryFee}</span>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">{t('checkout.grand_total')}</span>
                  <span className="text-xl font-extrabold text-brand-800 font-mono">৳{totals.grandTotal}</span>
                </div>
              </div>

              {/* Delivery Timeline Notice (Replaces advance payment warning) */}
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-xs text-slate-900 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                  <span className="text-base">🚚</span>
                  <span>{isBn ? 'ডেলিভারি সময়সীমা:' : 'Estimated Delivery Time:'}</span>
                </div>
                <div className="space-y-1.5 pl-6 text-slate-800 font-semibold text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <strong className="font-bold text-slate-900">{isBn ? 'ঢাকার ভেতরে —' : 'Inside Dhaka —'}</strong>
                    <span>{isBn ? '১-২ দিনের মধ্যে' : 'Within 1-2 days'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                    <strong className="font-bold text-slate-900">{isBn ? 'ঢাকার বাইরে —' : 'Outside Dhaka —'}</strong>
                    <span>{isBn ? '২-৩ দিনের মধ্যে ডেলিভারি পাবেন' : 'Within 2-3 days delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Agreement */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700 accent-brand-700 cursor-pointer shrink-0"
                  />
                  <span className="leading-snug">
                    {t('checkout.agree_terms')} <span className="text-rose-500 font-bold">*</span>
                  </span>
                </label>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-bold text-sm sm:text-base py-4 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>{t('checkout.placing_order')}</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-rose-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{t('checkout.confirm_order', 'অর্ডার কনফার্ম করুন')}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      </form>

    </div>
  );
}
