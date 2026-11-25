import React, { useEffect, useMemo, useRef, useState } from 'react';
import './threeInOne.css';
import { STORE_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import {
  SITE_CONFIG,
  getCheckoutSessionId,
  getFbp,
  getFbc,
  getExternalId,
  getFbLoginId,
  trackPurchase,
  trackSitePage,
  trackProductEvents,
  pixelTrack,
  saveCheckoutLead,
  resetCheckoutSession,
  newEventId,
  trackAddToCart,
  trackViewContent,
} from '../special-offer/storeCompat.js';

const OFFER = {
  did: '8c5e84fa18642aa8',
  slug: 'surokkha-7-in-1-pack',
  name: 'Surokkha 7 in 1 Protection Pack (14 Pcs)',
  regularPrice: 700,
  offerPrice: 550,
  pcs: 14,
  maxQty: 5,
};

const ADDONS = [
  { key: 'ribbed', did: '68c019a9c15c38dc', slug: 'mo-ultra-ribbed-5', name: 'MO Silver Ribbed', fullName: 'MO Silver Ribbed (5 Pcs)', pcs: 5, price: 200, badge: 'MO', bg: '#eef1f6', fg: '#334155', color: '#cbd5e1' },
  { key: 'dotted', did: 'b9de8b186df2b554', slug: 'mo-dotted-5', name: 'MO Dotted Pink', fullName: 'MO Dotted Pink (5 Pcs)', pcs: 5, price: 200, badge: 'MO', bg: '#fde7ef', fg: '#be185d', color: '#f4a7c4' },
  { key: 'thin', did: '788b855254ac89fa', slug: 'mo-ultra-thin-5', name: 'MO Ultra Thin', fullName: 'MO Ultra Thin Blue (5 Pcs)', pcs: 5, price: 200, badge: 'MO', bg: '#e0f2fe', fg: '#0369a1', color: '#38bdf8' },
];

const DELIVERY = {
  inside_dhaka: 70,
  outside_dhaka: 120,
};

const MAX_ADDON = 5;
const WHATSAPP = STORE_WHATSAPP_NUMBER;
const SPAM_PHONE_MSG = 'আপনার এই নম্বরটি আমাদের স্প্যাম লিস্টে আছে। দয়া করে আমাদের সাথে যোগাযোগ করুন।';
const FAKE_PHONE_MSG = 'অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন।';

// Converts western digits in a value to Bangla digits
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// Formats an amount as a Bangla taka string
const tk = (n) => '৳' + bn(Number(n).toLocaleString('en-IN'));

// Converts Bangla digits to western digits
const toEnDigits = (s) => s.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));

// Normalises a typed phone number to the local 01XXXXXXXXX form
const cleanPhone = (v) => {
  const p = toEnDigits(v).replace(/[^\d]/g, '');
  return p.startsWith('880') ? p.slice(2) : p;
};

// Validates a clean local mobile number
const phoneOk = (p) => /^01[3-9]\d{8}$/.test(p);

// Flags an invalid phone number while typing
const phoneWrongSoFar = (v) => {
  const p = cleanPhone(v);
  if (!p || '880'.startsWith(p)) return false;
  return !/^0(1([3-9]\d{0,8})?)?$/.test(p);
};

// Builds a WhatsApp chat link with a prefilled message
const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

// Sends a Meta pixel event
const track = (ev, data, eventId) => pixelTrack(ev, data, eventId);

// Adds the template fonts to the document head once
const useCampaignFonts = () => {
  useEffect(() => {
    document.title = 'Surokkha 7 in 1 Pack — ৭ ধরনের ১৪ পিস, মাত্র ৳৫৫০ | Surokkha';
    if (document.getElementById('so-fonts-3in1')) return;
    const link = document.createElement('link');
    link.id = 'so-fonts-3in1';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,800;1,700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const IconCart = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>);
const IconCheck = ({ w = 2.4 }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const IconLock = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconTruck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>);
const IconShield = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);
const IconCash = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>);
const IconBox = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/></svg>);
const IconGrid = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>);
const IconTag = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>);
const IconWa = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>);

const EMPTY_FORM = { name: '', phone: '', address: '', area: 'inside_dhaka', note: '' };

// Standalone campaign page for Surokkha 7 in 1 Pack
const ThreeInOneView = () => {
  useCampaignFonts();
  const [qty, setQty] = useState(1);
  const [addonQty, setAddonQty] = useState({ ribbed: 0, dotted: 0, thin: 0 });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState('');
  const [blockedPhone, setBlockedPhone] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSticky, setShowSticky] = useState(false);
  const startedRef = useRef(false);
  const cartedRef = useRef(false);
  const heroRef = useRef(null);
  const orderRef = useRef(null);
  const fieldRefs = useRef({});
  const touchedRef = useRef({});

  const phoneBlocked = blockedPhone && blockedPhone.phone === cleanPhone(form.phone) ? blockedPhone : null;

  const addonTotal = ADDONS.reduce((s, a) => s + addonQty[a.key] * a.price, 0);
  const addonPcs = ADDONS.reduce((s, a) => s + addonQty[a.key] * a.pcs, 0);
  const sub = qty * OFFER.offerPrice + addonTotal;
  const del = DELIVERY[form.area] || 70;
  const save = qty * (OFFER.regularPrice - OFFER.offerPrice);
  const total = sub + del;

  const leadRef = useRef(null);
  const submittingRef = useRef(false);
  leadRef.current = () => ({
    fullName: form.name.trim(),
    phone: cleanPhone(form.phone),
    email: '',
    address: form.address.trim(),
    district: form.area === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
    thana: '',
    cartTotal: total,
    items: [
      { slug: OFFER.slug, name: OFFER.name, quantity: qty, unitPrice: OFFER.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ slug: a.slug, name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price })),
    ],
  });

  const leadSig = JSON.stringify([form.name, form.phone, form.address, form.area, qty, addonQty]);
  useEffect(() => {
    if (!form.name.trim() && !form.phone.trim()) return undefined;
    const timer = setTimeout(() => saveCheckoutLead(leadRef.current()), 2000);
    return () => clearTimeout(timer);
  }, [leadSig]);

  useEffect(() => {
    const flush = () => {
      if (submittingRef.current) return;
      const lead = leadRef.current();
      if (lead.phone || lead.fullName) saveCheckoutLead(lead, true);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const waOrderLink = useMemo(() => waLink(`আমি Surokkha 7 in 1 Pack (১৪ পিস, ৳${OFFER.offerPrice}) অর্ডার করতে চাই।`), []);

  const pageTrackedRef = useRef(false);
  useEffect(() => {
    if (pageTrackedRef.current) return;
    pageTrackedRef.current = true;
    trackSitePage('3-in-1');
    const vcEventId = newEventId('vc');
    track('PageView');
    trackViewContent({ productDid: OFFER.did, productName: OFFER.name, price: OFFER.offerPrice, eventId: vcEventId });
    track('ViewContent', { content_ids: [OFFER.did], content_type: 'product', content_name: OFFER.name, value: OFFER.offerPrice, currency: 'BDT' }, vcEventId);
  }, []);

  useEffect(() => {
    let pastHero = false;
    let atOrder = false;
    const upd = () => setShowSticky(pastHero && !atOrder);
    const o1 = new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; upd(); });
    const o2 = new IntersectionObserver(([e]) => { atOrder = e.isIntersecting; upd(); }, { threshold: 0.15 });
    if (heroRef.current) o1.observe(heroRef.current);
    if (orderRef.current) o2.observe(orderRef.current);
    return () => { o1.disconnect(); o2.disconnect(); };
  }, []);

  // Changes one add-on count within limits and tracks additions
  const changeAddon = (a, delta) => {
    setAddonQty((prev) => ({ ...prev, [a.key]: Math.max(0, Math.min(MAX_ADDON, prev[a.key] + delta)) }));
    if (delta > 0) {
      const eventId = newEventId('atc');
      trackAddToCart({ productDid: a.did, productName: a.fullName, price: a.price, qty: 1, eventId });
      track('AddToCart', { value: a.price, currency: 'BDT', content_ids: [a.did], content_type: 'product' }, eventId);
      trackProductEvents([{ eventType: 'add_to_cart', productKey: a.slug, productName: a.fullName, quantity: 1, value: a.price }]);
    }
  };

  // Checks whether a phone number is on the spam or fake list
  const checkPhoneListed = async (raw) => {
    const phone = cleanPhone(raw);
    if (!phoneOk(phone)) return;
    try {
      const base = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch(`${base}/orders/check-phone?phone=${encodeURIComponent(phone.slice(-10))}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.isFake) setBlockedPhone({ phone, message: json.isSpam ? SPAM_PHONE_MSG : FAKE_PHONE_MSG });
    } catch (_) { return; }
  };

  // Updates one form field value and live validation
  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (k === 'phone') checkPhoneListed(v);
    const bad = k === 'name' ? v.trim().length < 2 : k === 'phone' ? (touchedRef.current.phone ? !phoneOk(cleanPhone(v)) : phoneWrongSoFar(v)) : k === 'address' ? v.trim().length < 5 : false;
    if (bad !== !!errors[k]) setErrors((prev) => ({ ...prev, [k]: bad }));
  };

  // Marks field as touched on blur and verifies value
  const onFieldBlur = (k) => {
    touchedRef.current[k] = true;
    const bad = k === 'name' ? form.name.trim().length < 2 : k === 'phone' ? !phoneOk(cleanPhone(form.phone)) : k === 'address' ? form.address.trim().length < 5 : false;
    if (bad !== !!errors[k]) setErrors((prev) => ({ ...prev, [k]: bad }));
  };

  // Tracks initial button click for main item
  const onOrderClick = () => {
    if (cartedRef.current) return;
    cartedRef.current = true;
    const eventId = newEventId('atc');
    trackAddToCart({ productDid: OFFER.did, productName: OFFER.name, price: OFFER.offerPrice, qty: 1, eventId });
    track('AddToCart', { value: OFFER.offerPrice, currency: 'BDT', content_ids: [OFFER.did], content_name: OFFER.name, content_type: 'product' }, eventId);
    trackProductEvents([{ eventType: 'add_to_cart', productKey: OFFER.slug, productName: OFFER.name, quantity: 1, value: OFFER.offerPrice }]);
  };

  // Fires checkout analytics on first interaction with form
  const onFormFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('InitiateCheckout', { value: total, currency: 'BDT', content_ids: [OFFER.did], content_type: 'product' }, `ic_${getCheckoutSessionId()}`);
    trackProductEvents([
      { eventType: 'checkout', productKey: OFFER.slug, productName: OFFER.name, quantity: qty, value: qty * OFFER.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ eventType: 'checkout', productKey: a.slug, productName: a.fullName, quantity: addonQty[a.key], value: addonQty[a.key] * a.price })),
    ]);
  };

  // Validates required form fields before submit
  const validate = () => {
    const v = {
      name: form.name.trim(),
      phone: cleanPhone(form.phone),
      address: form.address.trim(),
    };
    const bad = {
      name: v.name.length < 2,
      phone: !phoneOk(v.phone) || !!phoneBlocked,
      address: v.address.length < 5,
    };
    ['name', 'phone', 'address'].forEach((k) => { touchedRef.current[k] = true; });
    setErrors(bad);
    const first = Object.keys(bad).find((k) => bad[k]);
    if (first) {
      fieldRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs.current[first]?.focus();
      return null;
    }
    return v;
  };

  // Builds order items array for backend API
  const buildItems = () => [
    { productDid: OFFER.did, itemType: 'product', name: OFFER.name, quantity: qty, unitPrice: OFFER.offerPrice, size: '7 in 1 Pack (14 Pcs)' },
    ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({
      productDid: a.did, itemType: 'product', name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price, size: '5 Pcs Pack',
    })),
  ];

  // Creates fallback WhatsApp message
  const fallbackLink = (v) => waLink(
    `অর্ডার: Surokkha 7 in 1 Pack × ${qty}${ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => `\n+ ${a.fullName} × ${addonQty[a.key]}`).join('')}\nনাম: ${v.name}\nফোন: ${v.phone}\nঠিকানা: ${v.address}\nএলাকা: ${form.area === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}\nমোট: ৳${total}`,
  );

  // Submits order to backend API
  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setFailed('');
    const v = validate();
    if (!v) return;
    const nowIso = new Date().toISOString();
    const areaName = form.area === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka';
    const payload = {
      checkoutSessionId: getCheckoutSessionId(),
      billingInfo: { fullName: v.name, phone: v.phone, email: '', address: v.address, city: areaName, thana: '', district: areaName, state: areaName, division: areaName, zip: '' },
      shippingInfo: null,
      shipToDifferentAddress: false,
      fbp: getFbp() || undefined,
      fbc: getFbc() || undefined,
      fb_login_id: getFbLoginId() || undefined,
      externalId: getExternalId() || undefined,
      eventSourceUrl: window.location.href,
      siteKey: SITE_CONFIG.siteKey,
      clientDomain: SITE_CONFIG.domain,
      orderPrefix: SITE_CONFIG.orderPrefix,
      giftWrap: false,
      orderNotes: [form.note.trim(), `Landing 3-in-1 / 7-in-1 (${form.area === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`].filter(Boolean).join(' | '),
      paymentMethod: 'cod',
      subtotal: sub,
      shippingFee: del,
      shippingTotalAmount: del,
      tax: 0,
      discountTotalAmount: 0,
      couponCode: null,
      total,
      items: buildItems(),
      paymentDetails: null,
      timestamp: nowIso,
      createdAt: nowIso,
    };
    setSending(true);
    submittingRef.current = true;
    try {
      const base = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch(`${base}/orders/new-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 403 && json?.code === 'CONTACT_REQUIRED') {
        setBlockedPhone({ phone: v.phone, message: SPAM_PHONE_MSG });
        fieldRefs.current.phone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!res.ok) throw new Error(json?.errors?.join(', ') || json?.message || `HTTP ${res.status}`);
      const orderNumber = String(json?.data?.orderNumber || json?.data?.id || json?.orderNumber || '').trim();
      if (orderNumber) {
        const items = { [OFFER.did]: qty };
        const products = { [OFFER.did]: { did: OFFER.did, slug: OFFER.slug, name: OFFER.name, price: OFFER.offerPrice } };
        ADDONS.forEach((a) => {
          if (addonQty[a.key] > 0) {
            items[a.did] = addonQty[a.key];
            products[a.did] = { did: a.did, slug: a.slug, name: a.fullName, price: a.price };
          }
        });
        trackPurchase({
          orderNumber,
          items,
          totals: { subtotal: sub, grandTotal: total },
          customer: { name: v.name, mobile: v.phone, email: '', district: areaName, address: v.address },
        }, products);
      }
      setSuccess({ phone: v.phone, orderNumber });
      setForm(EMPTY_FORM);
      resetCheckoutSession();
      touchedRef.current = {};
      setQty(1);
      setAddonQty({ ribbed: 0, dotted: 0, thin: 0 });
    } catch (err) {
      setFailed(fallbackLink(v));
    } finally {
      setSending(false);
      submittingRef.current = false;
    }
  };

  const reg = (k) => (el) => { fieldRefs.current[k] = el; };

  return (
    <>
      <div className="topbar">স্পেশাল কম্বো অফার: Surokkha 7 in 1 Pack (১৪ পিস) মাত্র <b>৳৫৫০</b> · ৳১৫০ সেভ!</div>

      <header className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-logo">Surokkha<span>.</span></div>
          <div className="hero-grid">
            <div>
              <span className="eyebrow"><b>7-IN-1 TRIAL</b> ৪টি আন্তর্জাতিক ব্র্যান্ড এক বক্সে</span>
              <div className="brandline">Multi-Brand Protection Pack</div>
              <h1 className="hero-title">Surokkha <em>7 in 1</em></h1>
              <p className="hero-sub">এক বক্সে <strong>৭ ধরনের ১৪ পিস প্রিমিয়াম প্রোটেকশন প্যাক</strong>, প্রতিটা ভ্যারিয়েন্ট ২ পিস করে। আলাদা বক্স না কিনে সবগুলো ট্রাই করে বেছে নিন আপনার সেরা পছন্দ।</p>

              <div className="mix">
                <span className="chip"><i style={{ background: '#f4a7c4' }} />MO Pink <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#eab308' }} />Amore Gold <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#dc2626' }} />Skore Red <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#38bdf8' }} />MO Blue <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#1e293b' }} />Amore Black <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#f1f5f9' }} />MO Silver <small>× ২</small></span>
                <span className="chip"><i style={{ background: '#1d4ed8' }} />Durex Blue <small>× ২</small></span>
                <span className="total">১৪ <small>পিস</small></span>
              </div>

              <div className="price-row">
                <div className="price-now"><sup>৳</sup>৫৫০</div>
                <div className="price-tags"><span className="price-old">৳৭০০</span></div>
                <div className="price-tags">
                  <span className="ptag ptag-save">৳১৫০ সেভ</span>
                  <span className="ptag ptag-cod"><IconCheck />ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>

              <div className="ctas">
                <a href="#order" onClick={onOrderClick} className="btn btn-primary"><IconCart />এখনই অর্ডার করুন</a>
                <a href="#inside" className="btn btn-ghost">৭টি ভ্যারিয়েন্ট দেখুন</a>
              </div>

              <div className="trust">
                <span><IconLock />গোপনীয় প্যাকেজিং</span>
                <span><IconTruck />সারা দেশে হোম ডেলিভারি</span>
                <span><IconShield />১০০% অরিজিনাল</span>
              </div>
            </div>

            <div className="visual" aria-hidden="true">
              <div className="glow" />
              <div className="hero-frame skh-i-photo" />
              <div className="seal"><div><b>৭ in ১</b>১৪ পিস</div></div>
              <div className="ftag">
                <div className="ic"><IconBox /></div>
                <div><b>প্লেইন বক্সে ডেলিভারি</b><small>বাইরে থেকে কিছু বোঝা যাবে না</small></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="sec" id="inside">
          <div className="container">
            <div className="sec-head">
              <span className="kicker">বক্সে যা আছে</span>
              <h2 className="sec-title">৭ ধরনের ভ্যারিয়েন্ট, প্রতিটা ২ পিস</h2>
              <p className="sec-sub">আলাদা আলাদা বড় প্যাক কেনার ঝুঁকি নেই। MO, Amore, Skore ও Durex-এর সেরা ৭টি ভ্যারিয়েন্ট এক বক্সে ট্রাই করে দেখুন।</p>
            </div>
            <div className="inside-grid">
              <div className="photo-wrap">
                <div className="photo skh-i-photo" role="img" aria-label="Surokkha 7 in 1 Pack-এর ১৪টি ফয়েল">
                  <div className="photo-badge">Surokkha 7-in-1 Combo<small>১৪ পিস · ৭ ভ্যারিয়েন্ট · ৪ ব্র্যান্ড</small></div>
                </div>
              </div>
              <div className="variants">
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#fde7ef', color: '#be185d' }}>MO</div>
                  <div><div className="v-name"><i style={{ background: '#f4a7c4' }} />MO Dotted Pink</div><p className="v-desc">মাইক্রো-ডটেড টেক্সচার ফিনিশিং, অতিরিক্ত কমফোর্টের জন্য।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#fef3c7', color: '#b45309' }}>AMORE</div>
                  <div><div className="v-name"><i style={{ background: '#eab308' }} />Amore Gold Series</div><p className="v-desc">প্রিমিয়াম গোল্ড এডিশন, স্মুথ ও আরামদায়ক ফিট।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#fee2e2', color: '#b91c1c' }}>SKORE</div>
                  <div><div className="v-name"><i style={{ background: '#dc2626' }} />Skore Long-Lasting Red</div><p className="v-desc">স্পেশাল টাইম-এক্সটেন্ড ফর্মুলা ও নিরাপদ সুরক্ষা।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#e0f2fe', color: '#0369a1' }}>MO</div>
                  <div><div className="v-name"><i style={{ background: '#38bdf8' }} />MO Ultra Thin Blue</div><p className="v-desc">অতি পাতলা ডিজাইন, ন্যাচারাল কমফোর্ট ও হালকা অনুভূতির জন্য।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#1e293b', color: '#f8fafc' }}>AMORE</div>
                  <div><div className="v-name"><i style={{ background: '#1e293b' }} />Amore Black Edition</div><p className="v-desc">কনট্যুরড রিবড গ্রিপ ও লাক্সারি ম্যাট ফিনিশিং।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#eef1f6', color: '#334155' }}>MO</div>
                  <div><div className="v-name"><i style={{ background: '#cbd5e1' }} />MO Ultra Ribbed Silver</div><p className="v-desc">রিবড টেক্সচার প্যাটার্ন, ব্যালেন্সড ও সুরক্ষিত গ্রিপের জন্য।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-swatch" style={{ background: '#dbeafe', color: '#1d4ed8' }}>DUREX</div>
                  <div><div className="v-name"><i style={{ background: '#1d4ed8' }} />Durex Classic Blue</div><p className="v-desc">আন্তর্জাতিক মানের পরীক্ষিত ও বিশ্বস্ত প্রোটেকশন প্যাক।</p></div>
                  <span className="v-qty">× ২ পিস</span>
                </div>
                <div className="inside-total"><span>মোট এক বক্সে (৭ × ২ পিস)</span><b>১৪ পিস</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec why">
          <div className="container">
            <div className="sec-head">
              <span className="kicker">কেন 7 in 1 Pack</span>
              <h2 className="sec-title">সেরা ব্র্যান্ডগুলো চেনার সবচেয়ে সহজ উপায়</h2>
            </div>
            <div className="why-grid">
              <div className="why-card">
                <div className="why-ic"><IconGrid /></div>
                <h3>এক বক্সে ৭ ভ্যারিয়েন্ট</h3>
                <p>আলাদা আলাদা প্যাক কিনতে হবে না। MO, Amore, Skore আর Durex-এর ৭টি ভ্যারিয়েন্ট একসাথে।</p>
              </div>
              <div className="why-card">
                <div className="why-ic"><IconTag /></div>
                <h3>৳১৫০ সরাসরি সেভ</h3>
                <p>নিয়মিত দাম ৳৭০০, স্পেশাল অফারে পাচ্ছেন মাত্র ৳৫৫০ টাকায়।</p>
              </div>
              <div className="why-card">
                <div className="why-ic"><IconShield /></div>
                <h3>১০০% অরিজিনাল স্টক</h3>
                <p>ISO 4074 সার্টিফাইড ও সরাসরি অনুমোদিত সোর্স থেকে সংগৃহীত আসল প্রোডাক্ট।</p>
              </div>
              <div className="why-card">
                <div className="why-ic"><IconCash /></div>
                <h3>হাতে পেয়ে টাকা দিন</h3>
                <p>অগ্রিম কিছু দিতে হবে না। পার্সেল হাতে পেয়ে ক্যাশ অন ডেলিভারিতে পেমেন্ট।</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="container">
            <div className="sec-head">
              <span className="kicker">কীভাবে পাবেন</span>
              <h2 className="sec-title">অর্ডার থেকে ডেলিভারি, পুরোটাই গোপনীয়</h2>
            </div>
            <div className="steps">
              <div className="step"><div className="step-n">১</div><h3>অর্ডার করুন</h3><p>নিচের ফর্মে নাম, নম্বর আর ঠিকানা দিন। এক মিনিটও লাগবে না।</p></div>
              <div className="step"><div className="step-n">২</div><h3>কলে কনফার্ম</h3><p>আমাদের টিম আপনার নম্বরে কল করে অর্ডারটা কনফার্ম করবে।</p></div>
              <div className="step"><div className="step-n">৩</div><h3>প্লেইন বক্সে ডেলিভারি</h3><p>সাধারণ আনলেবেলড প্যাকেটে আপনার ঠিকানায় পৌঁছাবে। হাতে পেয়ে টাকা দিন।</p></div>
            </div>
            <div className="privacy">
              <div className="ic"><IconLock /></div>
              <p><b>প্যাকেটের বাইরে প্রোডাক্টের নাম বা ছবি থাকে না।</b> ডেলিভারিম্যান বা আশেপাশের কেউ বুঝবে না ভেতরে কী আছে।</p>
            </div>
          </div>
        </section>

        <section className="sec order" id="order" ref={orderRef}>
          <div className="container">
            <div className="sec-head">
              <span className="kicker">অর্ডার করুন</span>
              <h2 className="sec-title">অফার থাকতেই আপনার Surokkha 7 in 1 নিন</h2>
              <p className="sec-sub">কোনো অগ্রিম পেমেন্ট নেই। অর্ডারের পর আমরা কল করে কনফার্ম করব।</p>
            </div>

            <div className="order-card">
              <aside className="summary">
                <div className="sum-prod">
                  <div className="sum-thumb skh-i-thumb" />
                  <div><h3>Surokkha 7 in 1 Pack</h3><p>১৪ পিস · ৭ ভ্যারিয়েন্ট (MO, Amore, Skore, Durex)</p></div>
                </div>
                <div className="qty">
                  <label htmlFor="qtyOut">পরিমাণ (বক্স)</label>
                  <div className="qty-ctl">
                    <button type="button" aria-label="কমান" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <output id="qtyOut">{bn(qty)}</output>
                    <button type="button" aria-label="বাড়ান" onClick={() => setQty((q) => Math.min(OFFER.maxQty, q + 1))}>+</button>
                  </div>
                </div>
                <div className="addons">
                  <div className="addons-head">সাথে আরও নিন <small>প্রতি ৫ পিস ৳২০০</small></div>
                  <div className="addon-list">
                    {ADDONS.map((a) => {
                      const n = addonQty[a.key];
                      return (
                        <div key={a.key} className={`addon${n > 0 ? ' on' : ''}`}>
                          <div className="addon-badge" style={{ background: a.bg, color: a.fg }}>{a.badge}</div>
                          <div><div className="addon-name"><i style={{ background: a.color }} />{a.name}</div><div className="addon-meta">+{bn(a.pcs)} পিস · {tk(a.price)}</div></div>
                          <div>
                            {n === 0
                              ? <button type="button" className="addon-add" onClick={() => changeAddon(a, 1)}>+ যোগ করুন</button>
                              : (
                                <div className="qty-ctl">
                                  <button type="button" aria-label="কমান" onClick={() => changeAddon(a, -1)}>−</button>
                                  <output>{bn(n)}</output>
                                  <button type="button" aria-label="বাড়ান" onClick={() => changeAddon(a, 1)}>+</button>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lines">
                  <div className="line"><span>দাম ({bn(qty)} × ৳৫৫০)</span><span><s>{tk(qty * OFFER.regularPrice)}</s><b>{tk(qty * OFFER.offerPrice)}</b></span></div>
                  {ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => (
                    <div key={a.key} className="line line-add"><span>{a.name} {bn(addonQty[a.key] * a.pcs)} পিস</span><b>{tk(addonQty[a.key] * a.price)}</b></div>
                  ))}
                  <div className="line"><span>মোট পিস</span><b>{bn(qty * OFFER.pcs + addonPcs)} পিস</b></div>
                  <div className="line"><span>ডেলিভারি চার্জ ({form.area === 'inside_dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})</span><b>{tk(del)}</b></div>
                  <div className="line line-save"><span>আপনার ডিসকাউন্ট সেভ</span><b>{tk(save)}</b></div>
                </div>
                <div className="grand"><span>সর্বমোট</span><b>{tk(total)}</b></div>
                <div className="sum-note">
                  <span><IconCash />পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</span>
                  <span><IconLock />প্লেইন বক্সে গোপনীয় ডেলিভারি</span>
                </div>
              </aside>

              <form className="form" noValidate onSubmit={onSubmit} onFocus={onFormFocus}>
                <h3>ডেলিভারির তথ্য দিন</h3>
                <p className="form-sub">সঠিক নম্বর দিন, এই নম্বরেই কল করে অর্ডার কনফার্ম করা হবে।</p>
                <div className="fields">
                  <div className={`field${errors.name ? ' err' : ''}`}>
                    <label htmlFor="fName">আপনার নাম <em>*</em></label>
                    <input id="fName" ref={reg('name')} onBlur={() => onFieldBlur('name')} autoComplete="name" placeholder="যেমন: রাকিব হাসান" value={form.name} onChange={(e) => setField('name', e.target.value)} />
                    <div className="msg">আপনার নাম লিখুন</div>
                  </div>
                  <div className={`field${errors.phone || phoneBlocked ? ' err' : ''}`}>
                    <label htmlFor="fPhone">মোবাইল নম্বর <em>*</em></label>
                    <input id="fPhone" ref={reg('phone')} onBlur={() => onFieldBlur('phone')} type="tel" inputMode="numeric" autoComplete="tel" placeholder="01XXXXXXXXX" maxLength={14} value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                    <div className="msg">{phoneBlocked ? phoneBlocked.message : 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01 দিয়ে শুরু)'}</div>
                  </div>
                  <div className={`field${errors.address ? ' err' : ''}`}>
                    <label htmlFor="fAddress">সম্পূর্ণ ঠিকানা <em>*</em></label>
                    <textarea id="fAddress" ref={reg('address')} onBlur={() => onFieldBlur('address')} autoComplete="street-address" placeholder="বাসা/রোড, এলাকা, থানা, জেলা" value={form.address} onChange={(e) => setField('address', e.target.value)} />
                    <div className="msg">ডেলিভারির ঠিকানা লিখুন</div>
                  </div>
                  <div className="field">
                    <label>ডেলিভারি এলাকা <em>*</em></label>
                    <div className="area">
                      <input type="radio" name="area" id="aIn" value="inside_dhaka" checked={form.area === 'inside_dhaka'} onChange={() => setField('area', 'inside_dhaka')} />
                      <label htmlFor="aIn">ঢাকার ভেতরে <small>ডেলিভারি চার্জ ৳৭০</small></label>
                      <input type="radio" name="area" id="aOut" value="outside_dhaka" checked={form.area === 'outside_dhaka'} onChange={() => setField('area', 'outside_dhaka')} />
                      <label htmlFor="aOut">ঢাকার বাইরে <small>ডেলিভারি চার্জ ৳১২০</small></label>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="fNote">বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                    <input id="fNote" placeholder="যেমন: বিকেল ৫টার পর কল দেবেন" value={form.note} onChange={(e) => setField('note', e.target.value)} />
                  </div>
                </div>

                <button type="submit" className={`btn btn-primary submit${sending ? ' loading' : ''}`} disabled={sending}>
                  <span className="spinner" />
                  <span className="btn-ico"><IconCheck w={2.2} /></span>
                  <span>অর্ডার কনফার্ম করুন · {tk(total)}</span>
                </button>
                <div className={`form-err${failed ? ' show' : ''}`}>
                  দুঃখিত, অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন, অথবা <a href={failed || waOrderLink} target="_blank" rel="noopener noreferrer">WhatsApp-এ অর্ডার দিন</a>।
                </div>
                <p className="form-foot">অর্ডার করতে সমস্যা? <a href={waOrderLink} target="_blank" rel="noopener noreferrer"><b>WhatsApp-এ মেসেজ দিন</b></a></p>
              </form>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="container">
            <div className="sec-head">
              <span className="kicker">প্রশ্ন ও উত্তর</span>
              <h2 className="sec-title">যা জানতে চান</h2>
            </div>
            <div className="faq">
              <details open>
                <summary>প্যাকেটের বাইরে কি লেখা থাকবে ভেতরে কী আছে?</summary>
                <p>না। প্রোডাক্ট সাধারণ প্লেইন প্যাকেটে পাঠানো হয়, বাইরে প্রোডাক্টের নাম বা ছবি থাকে না।</p>
              </details>
              <details>
                <summary>ডেলিভারিম্যান কি জানতে পারবে?</summary>
                <p>না। ডেলিভারিম্যান শুধু একটা সাধারণ পার্সেল হাতে পায়, ভেতরে কী আছে সেটা তার জানার কথা নয়।</p>
              </details>
              <details>
                <summary>পেমেন্ট কীভাবে করব?</summary>
                <p>ক্যাশ অন ডেলিভারি। প্রোডাক্ট হাতে পেয়ে ডেলিভারিম্যানকে টাকা দেবেন, আগে কিছু দিতে হবে না।</p>
              </details>
              <details>
                <summary>ডেলিভারি চার্জ কত?</summary>
                <p>ঢাকার ভেতরে ডেলিভারি চার্জ ৳৭০ এবং ঢাকার বাইরে সারা বাংলাদেশে ডেলিভারি চার্জ ৳১২০।</p>
              </details>
              <details>
                <summary>অর্ডারের পর কী হবে?</summary>
                <p>আমাদের টিম আপনার দেওয়া নম্বরে কল করে অর্ডার কনফার্ম করবে এবং ডেলিভারির সময় জানিয়ে দেবে।</p>
              </details>
              <details>
                <summary>এই কম্বো প্যাকে কোন কোন ভ্যারিয়েন্ট থাকছে?</summary>
                <p>MO Dotted Pink (২ পিস), Amore Gold (২ পিস), Skore Red (২ পিস), MO Ultra Thin Blue (২ পিস), Amore Black (২ পিস), MO Ultra Ribbed Silver (২ পিস) এবং Durex Classic Blue (২ পিস) — মোট ৭ ধরনের ১৪ পিস থাকছে এক বক্সে।</p>
              </details>
            </div>
          </div>
        </section>

        <section className="sec final">
          <div className="container">
            <h2>৭ ধরনের প্রিমিয়াম প্যাক, ১৪ পিস, মাত্র <span>৳৫৫০</span></h2>
            <p>ক্যাশ অন ডেলিভারি · ১০০% অরিজিনাল · গোপনীয় প্যাকেজিং</p>
            <div className="ctas">
              <a href="#order" onClick={onOrderClick} className="btn btn-primary"><IconCart />এখনই অর্ডার করুন</a>
              <a href={waOrderLink} target="_blank" rel="noopener noreferrer" className="btn btn-wa"><IconWa />WhatsApp-এ অর্ডার</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <b>Surokkha<span>.</span></b>
          <a href={waOrderLink} target="_blank" rel="noopener noreferrer">WhatsApp-এ যোগাযোগ</a>
          <span>© {bn(new Date().getFullYear())} Surokkha. সর্বস্বত্ব সংরক্ষিত।</span>
        </div>
      </footer>

      <a className="wa-float" href={waOrderLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp-এ মেসেজ দিন">
        <IconWa />
      </a>

      <div className={`sticky${showSticky ? ' show' : ''}`}>
        <div className="sp">
          <b>৳৫৫০</b>
          <small><s>৳৭০০</s> + ডেলিভারি চার্জ</small>
        </div>
        <a href="#order" onClick={onOrderClick} className="btn btn-primary">অর্ডার করুন</a>
      </div>

      <div className={`modal${success ? ' show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="okTitle" onClick={(e) => { if (e.target === e.currentTarget) setSuccess(null); }}>
        <div className="modal-box">
          <div className="tick"><IconCheck w={2.6} /></div>
          <h3 id="okTitle">ধন্যবাদ, অর্ডার পেয়েছি!</h3>
          <p>আমাদের টিম শীঘ্রই <b>{success ? bn(success.phone) : ''}</b> নম্বরে কল করে আপনার অর্ডার কনফার্ম করবে। ফোনটা কাছে রাখুন।</p>
          {success?.orderNumber ? (
            <div className="order-id" style={{ display: 'block' }}>অর্ডার আইডি: <b>{success.orderNumber}</b></div>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={() => setSuccess(null)}>ঠিক আছে</button>
        </div>
      </div>
    </>
  );
};

export default ThreeInOneView;