import React, { useEffect, useMemo, useRef, useState } from 'react';
import './specialOffer.css';
import DistrictPicker from './SpecialOfferDistrictPicker.jsx';
import logoImg from './logo.png';
import { STORE_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { SITE_CONFIG, DISTRICTS, getCheckoutSessionId, getFbp, getFbc, getExternalId, getFbLoginId, trackPurchase, trackSitePage, trackProductEvents, pixelTrack, saveCheckoutLead, resetCheckoutSession } from './storeCompat.js';

const OFFER = {
  did: 'd5a81e97721c8101',
  slug: 'mo-smart-pack-18-pcs',
  name: 'MO 3-in-1 Smart Pack (18 Pcs)',
  regularPrice: 810,
  offerPrice: 720,
  pcs: 18,
  maxQty: 5,
};

const ADDONS = [
  { key: 'white', did: '091bfca429b96b19', slug: 'mo-white-5-pcs', name: 'MO White', fullName: 'Mo White 2 Pcs', pcs: 2, price: 70, img: 'skh-i-white', color: '#f1f5f9' },
  { key: 'pink', did: '6bb5a600017c619b', slug: 'mo-pink-5-pcs', name: 'MO Pink', fullName: 'Mo Pink 2 Pcs', pcs: 2, price: 70, img: 'skh-i-pink', color: '#f4a7c4' },
  { key: 'blue', did: '1c54b907d7a216dc', slug: 'mo-blue-5-pcs', name: 'MO Blue', fullName: 'Mo Blue 2 Pcs', pcs: 2, price: 70, img: 'skh-i-blue', color: '#38bdf8' },
  { key: 'ky', did: '5f3afc27eaaef962', slug: 'ky-jelly-personal-lubricant-gel-50g', name: 'KY Gel', fullName: 'KY Jelly Personal Lubricant Gel 50g', pcs: 1, price: 300, img: 'skh-i-ky', color: '#0ea5e9', itemType: 'item', size: '50g Tube' },
];

const MAX_ADDON = 5;
const NORMAL_DELIVERY = 120;
const WHATSAPP = STORE_WHATSAPP_NUMBER;
const DISTRICT_NAMES = DISTRICTS.map((d) => d.name).sort((a, b) => a.localeCompare(b));

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

// Tells whether each mandatory field value is acceptable
const FIELD_OK = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => /^01[3-9]\d{8}$/.test(cleanPhone(v)),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  district: (v) => DISTRICT_NAMES.includes(v),
  address: (v) => v.trim().length >= 5,
};

// Flags a phone number that is already wrong while it is still being typed
const phoneWrongSoFar = (v) => {
  const p = cleanPhone(v);
  if (!p || '880'.startsWith(p)) return false;
  return !/^0(1([3-9]\d{0,8})?)?$/.test(p);
};

const SPAM_PHONE_MSG = 'আপনার এই নম্বরটি আমাদের স্প্যাম লিস্টে আছে। দয়া করে আমাদের সাথে যোগাযোগ করুন।';
const FAKE_PHONE_MSG = 'অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন।';

// Records one Smart Pack view per visitor per 30 minutes in the dashboard product funnel
const trackSmartPackView = () => {
  const key = `_sk_pv_${OFFER.slug}`;
  try {
    const last = Number(window.sessionStorage.getItem(key) || 0);
    if (last && Date.now() - last < 30 * 60 * 1000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch (_) { return; }
  trackProductEvents([{ eventType: 'view', productKey: OFFER.slug, productName: OFFER.name }]);
};

// Builds a WhatsApp chat link with a prefilled message
const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

// Sends a Meta pixel event through the Store pixel (it loads the pixel on first use)
const track = (ev, data) => pixelTrack(ev, data);

// Adds the template fonts to the document head once
const useCampaignFonts = () => {
  useEffect(() => {
    document.title = 'MO Smart Pack — ৩ ধরনের ১৮ পিস, মাত্র ৳৭২০ | Surokkha';
    if (document.getElementById('so-fonts')) return;
    const link = document.createElement('link');
    link.id = 'so-fonts';
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

// Renders five stacked pack images for the hero visual
const Stack = ({ cls, img }) => (
  <div className={`stack ${cls}`}>
    {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`skh-img ${img}`} />)}
  </div>
);

const EMPTY_FORM = { name: '', phone: '', email: '', district: '', address: '', note: '' };

// Standalone MO Smart Pack campaign page with its own order form and free delivery
const SpecialOfferView = () => {
  useCampaignFonts();
  const [qty, setQty] = useState(1);
  const [addonQty, setAddonQty] = useState({ white: 0, pink: 0, blue: 0, ky: 0 });
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
  const save = qty * (OFFER.regularPrice - OFFER.offerPrice) + NORMAL_DELIVERY;
  const total = sub;

  // Keeps what the customer has typed so an abandoned checkout is saved, like the main checkout does
  const leadRef = useRef(null);
  const submittingRef = useRef(false);
  leadRef.current = () => ({
    fullName: form.name.trim(),
    phone: cleanPhone(form.phone),
    email: form.email.trim(),
    address: form.address.trim(),
    district: form.district,
    thana: '',
    cartTotal: total,
    items: [
      { slug: OFFER.slug, name: OFFER.name, quantity: qty, unitPrice: OFFER.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ slug: a.slug, name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price })),
    ],
  });
  const leadSig = JSON.stringify([form.name, form.phone, form.email, form.address, form.district, qty, addonQty]);
  useEffect(() => {
    if (!form.name.trim() && !form.phone.trim() && !form.email.trim()) return undefined;
    const timer = setTimeout(() => saveCheckoutLead(leadRef.current()), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadSig]);
  useEffect(() => {
    const flush = () => {
      if (submittingRef.current) return;
      const lead = leadRef.current();
      if (lead.phone || lead.fullName || lead.email) saveCheckoutLead(lead, true);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const waOrderLink = useMemo(() => waLink(`আমি MO Smart Pack (১৮ পিস, ৳${OFFER.offerPrice}) অর্ডার করতে চাই।`), []);

  useEffect(() => {
    trackSitePage('special-offer');
    trackSmartPackView();
    track('ViewContent', { content_ids: [OFFER.did], content_type: 'product', content_name: OFFER.name, value: OFFER.offerPrice, currency: 'BDT' });
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

  // Changes one add-on count within its limits and tracks additions
  const changeAddon = (a, delta) => {
    setAddonQty((prev) => ({ ...prev, [a.key]: Math.max(0, Math.min(MAX_ADDON, prev[a.key] + delta)) }));
    if (delta > 0) {
      track('AddToCart', { value: a.price, currency: 'BDT', content_ids: [a.did], content_type: 'product' });
      trackProductEvents([{ eventType: 'add_to_cart', productKey: a.slug, productName: a.fullName, quantity: 1, value: a.price }]);
    }
  };

  // Asks the backend whether a complete phone number is on the spam / fake list
  const checkPhoneListed = async (raw) => {
    const phone = cleanPhone(raw);
    if (!FIELD_OK.phone(phone)) return;
    try {
      const base = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch(`${base}/orders/check-phone?phone=${encodeURIComponent(phone.slice(-10))}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.isFake) setBlockedPhone({ phone, message: json.isSpam ? SPAM_PHONE_MSG : FAKE_PHONE_MSG });
    } catch (_) { return; }
  };

  // Updates one form field and re-checks it live once touched, or at once for a wrong phone prefix
  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (k === 'phone') checkPhoneListed(v);
    if (!FIELD_OK[k]) return;
    const bad = touchedRef.current[k] ? !FIELD_OK[k](v) : k === 'phone' && phoneWrongSoFar(v);
    if (bad !== !!errors[k]) setErrors((prev) => ({ ...prev, [k]: bad }));
  };

  // Checks a field when the customer leaves it
  const onFieldBlur = (k) => {
    touchedRef.current[k] = true;
    const bad = !FIELD_OK[k](form[k]);
    if (bad !== !!errors[k]) setErrors((prev) => ({ ...prev, [k]: bad }));
  };

  // Fires AddToCart for the main pack the first time any order button is pressed
  const onOrderClick = () => {
    if (cartedRef.current) return;
    cartedRef.current = true;
    track('AddToCart', { value: OFFER.offerPrice, currency: 'BDT', content_ids: [OFFER.did], content_name: OFFER.name, content_type: 'product' });
    trackProductEvents([{ eventType: 'add_to_cart', productKey: OFFER.slug, productName: OFFER.name, quantity: 1, value: OFFER.offerPrice }]);
  };

  // Fires InitiateCheckout the first time the form gets focus
  const onFormFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('InitiateCheckout', { value: total, currency: 'BDT', content_ids: [OFFER.did], content_type: 'product' });
    trackProductEvents([
      { eventType: 'checkout', productKey: OFFER.slug, productName: OFFER.name, quantity: qty, value: qty * OFFER.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ eventType: 'checkout', productKey: a.slug, productName: a.fullName, quantity: addonQty[a.key], value: addonQty[a.key] * a.price })),
    ]);
  };

  // Checks every mandatory field and focuses the first invalid one
  const validate = () => {
    const v = {
      name: form.name.trim(),
      phone: cleanPhone(form.phone),
      email: form.email.trim(),
      district: form.district,
      address: form.address.trim(),
    };
    const bad = Object.fromEntries(Object.keys(FIELD_OK).map((k) => [k, !FIELD_OK[k](form[k])]));
    if (phoneBlocked) bad.phone = true;
    Object.keys(FIELD_OK).forEach((k) => { touchedRef.current[k] = true; });
    setErrors(bad);
    const first = Object.keys(bad).find((k) => bad[k]);
    if (first) {
      fieldRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return null;
    }
    return v;
  };

  // Builds the order line items for the backend
  const buildItems = () => [
    { productDid: OFFER.did, itemType: 'product', name: OFFER.name, quantity: qty, unitPrice: OFFER.offerPrice, size: 'Special Offer' },
    ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({
      productDid: a.did, itemType: a.itemType || 'product', name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price, size: a.size || 'Special Offer Add-on (2 Pcs)',
    })),
  ];

  // Builds a WhatsApp fallback message from the current order
  const fallbackLink = (v) => waLink(
    `অর্ডার: MO Smart Pack × ${qty}${ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => `\n+ ${a.fullName} × ${addonQty[a.key]}`).join('')}\nনাম: ${v.name}\nফোন: ${v.phone}\nইমেইল: ${v.email}\nজেলা: ${v.district}\nঠিকানা: ${v.address}\nমোট: ৳${total}`,
  );

  // Sends the order to the shop order API with free delivery
  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setFailed('');
    const v = validate();
    if (!v) return;
    const nowIso = new Date().toISOString();
    const payload = {
      checkoutSessionId: getCheckoutSessionId(),
      billingInfo: { fullName: v.name, phone: v.phone, email: v.email, address: v.address, city: v.district, thana: '', district: v.district, state: v.district, division: v.district, zip: '' },
      shippingInfo: null,
      shipToDifferentAddress: false,
      fbp: getFbp() || undefined,
      fbc: getFbc() || undefined,
      fb_login_id: getFbLoginId() || undefined,
      externalId: getExternalId() || undefined,
      siteKey: SITE_CONFIG.siteKey,
      clientDomain: SITE_CONFIG.domain,
      orderPrefix: SITE_CONFIG.orderPrefix,
      giftWrap: false,
      orderNotes: [form.note.trim(), 'Special offer page (free delivery)'].filter(Boolean).join(' | '),
      paymentMethod: 'cod',
      subtotal: sub,
      shippingFee: 0,
      shippingTotalAmount: 0,
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
          customer: { name: v.name, mobile: v.phone, email: v.email, district: v.district, address: v.address },
        }, products);
      }
      setSuccess({ phone: v.phone, orderNumber });
      setForm(EMPTY_FORM);
      resetCheckoutSession();
      touchedRef.current = {};
      setQty(1);
      setAddonQty({ white: 0, pink: 0, blue: 0, ky: 0 });
    } catch (err) {
      setFailed(fallbackLink(v));
    } finally {
      setSending(false);
      submittingRef.current = false;
    }
  };

  // Registers a form control so validation can focus it
  const reg = (k) => (el) => { fieldRefs.current[k] = el; };

  return (
    <>
      <div className="topbar">আজকের অফার: MO Smart Pack <b>৳৭২০</b> + <b>ফ্রি ডেলিভারি</b> সারা বাংলাদেশে</div>

      <header className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-logo"><img src={logoImg} alt="Surokkha" /></div>
          <div className="hero-grid">
            <div>
              <span className="eyebrow"><b>NEW</b> MO প্রথমবার? এই প্যাক দিয়ে শুরু করুন</span>
              <div className="brandline">MO Personal Care</div>
              <h1 className="hero-title">Smart <em>Pack</em></h1>
              <p className="hero-sub">এক বক্সে <strong>MO-এর তিনটি ভ্যারিয়েন্ট</strong>, প্রতিটি ৬ পিস করে। তিনটাই ট্রাই করে দেখুন কেমন, তারপর বেছে নিন আপনার পছন্দেরটা।</p>

              <div className="mix">
                <span className="chip"><i style={{ background: '#f1f5f9' }} />MO White <small>× ৬</small></span>
                <span className="op">+</span>
                <span className="chip"><i style={{ background: '#f4a7c4' }} />MO Pink <small>× ৬</small></span>
                <span className="op">+</span>
                <span className="chip"><i style={{ background: '#38bdf8' }} />MO Blue <small>× ৬</small></span>
                <span className="op">=</span>
                <span className="total">১৮ <small>পিস</small></span>
              </div>

              <div className="price-row">
                <div className="price-now"><sup>৳</sup>৭২০</div>
                <div className="price-tags"><span className="price-old">৳৮১০</span></div>
                <div className="price-tags">
                  <span className="ptag ptag-save">৳৯০ সেভ</span>
                  <span className="ptag ptag-free"><IconCheck />ফ্রি ডেলিভারি</span>
                </div>
              </div>

              <div className="ctas">
                <a href="#order" onClick={onOrderClick} className="btn btn-primary"><IconCart />এখনই অর্ডার করুন</a>
                <a href="#inside" className="btn btn-ghost">বক্সে কী আছে দেখুন</a>
              </div>

              <div className="trust">
                <span><IconBox />বেস্ট প্যাকেজিং</span>
                <span><IconTruck />ক্যাশ অন ডেলিভারি</span>
                <span><IconShield />১০০% অথেন্টিক</span>
              </div>
            </div>

            <div className="visual" aria-hidden="true">
              <div className="glow" /><div className="ring" />
              <Stack cls="s-white" img="skh-i-white" />
              <Stack cls="s-pink" img="skh-i-pink" />
              <Stack cls="s-blue" img="skh-i-blue" />
              <span className="count c-white"><i style={{ background: '#f1f5f9' }} />× ৬</span>
              <span className="count c-pink"><i style={{ background: '#f4a7c4' }} />× ৬</span>
              <span className="count c-blue"><i style={{ background: '#38bdf8' }} />× ৬</span>
              <div className="seal"><div><b>৩ in ১</b>স্মার্ট প্যাক</div></div>
              <div className="ftag">
                <div className="ic"><IconBox /></div>
                <div><b>প্রিমিয়াম প্যাকেজিং</b><small>ডেলিভারিতে কোনো ড্যামেজ হবে না</small></div>
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
              <h2 className="sec-title">৩ ধরনের MO, প্রতিটা ৬ পিস</h2>
            </div>
            <div className="inside-grid">
              <div className="photo skh-i-photo" role="img" aria-label="MO Smart Pack-এর ১৮টি প্যাকেট">
                <div className="photo-badge">MO 3-in-1 Smart Pack<small>১৮ পিস · ৩ ভ্যারিয়েন্ট</small></div>
              </div>
              <div className="variants">
                <div className="variant">
                  <div className="v-img skh-img skh-i-white" style={{ '--bg': '#eef1f6' }} />
                  <div><div className="v-name"><i style={{ background: '#f1f5f9' }} />MO White</div></div>
                  <span className="v-qty">× ৬ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-img skh-img skh-i-pink" style={{ '--bg': '#fde7ef' }} />
                  <div><div className="v-name"><i style={{ background: '#f4a7c4' }} />MO Pink</div></div>
                  <span className="v-qty">× ৬ পিস</span>
                </div>
                <div className="variant">
                  <div className="v-img skh-img skh-i-blue" style={{ '--bg': '#e0f2fe' }} />
                  <div><div className="v-name"><i style={{ background: '#38bdf8' }} />MO Blue</div></div>
                  <span className="v-qty">× ৬ পিস</span>
                </div>
                <div className="inside-total"><span>মোট এক বক্সে</span><b>১৮ পিস</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="container">
            <div className="steps">
              <div className="step"><div className="step-n">১</div><h3>অর্ডার করুন</h3><p>নিচের ফর্মে নাম, নম্বর আর ঠিকানা দিন। এক মিনিটও লাগবে না।</p></div>
              <div className="step"><div className="step-n">২</div><h3>কলে কনফার্ম</h3><p>আমাদের টিম আপনার নম্বরে কল করে অর্ডারটা কনফার্ম করবে।</p></div>
              <div className="step"><div className="step-n">৩</div><h3>প্রিমিয়াম প্যাকেজিংয়ে ডেলিভারি</h3><p>খুব ভালোভাবে প্রিমিয়াম প্যাকেজিংয়ে আপনার ঠিকানায় পৌঁছাবে, ডেলিভারিতে কোনো ড্যামেজ হবে না। হাতে পেয়ে টাকা দিন।</p></div>
            </div>
            <div className="privacy">
              <div className="ic"><IconBox /></div>
              <p><b>বেস্ট প্যাকেজিং গ্যারান্টি:</b> আমরা প্রতিটি প্রোডাক্ট খুব যত্নসহকারে প্রিমিয়াম প্যাকেজিং করি, যাতে হোম ডেলিভারি বা কুরিয়ার সার্ভিসে আমাদের প্রোডাক্টের কোনো ধরনের ড্যামেজ বা কোনো সমস্যা না হয়।</p>
            </div>
          </div>
        </section>

        <section className="sec order" id="order" ref={orderRef}>
          <div className="container">
            <div className="sec-head">
              <span className="kicker">অর্ডার করুন</span>
              <h2 className="sec-title">অফার থাকতেই আপনার Smart Pack নিন</h2>
              <p className="sec-sub">কোনো অগ্রিম পেমেন্ট নেই। অর্ডারের পর আমরা কল করে কনফার্ম করব।</p>
            </div>

            <div className="order-card">
              <aside className="summary">
                <div className="sum-prod">
                  <div className="sum-thumb skh-i-thumb" />
                  <div><h3>MO 3-in-1 Smart Pack</h3><p>১৮ পিস · MO White, MO Pink, MO Blue</p></div>
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
                  <div className="addons-head">সাথে আরও নিন <small>অফার মূল্যে</small></div>
                  <div className="addon-list">
                    {ADDONS.map((a) => {
                      const n = addonQty[a.key];
                      return (
                        <div key={a.key} className={`addon${n > 0 ? ' on' : ''}`}>
                          <div className={`addon-img skh-img ${a.img}`} />
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
                  <div className="line"><span>দাম ({bn(qty)} × ৳৭২০)</span><span><s>{tk(qty * OFFER.regularPrice)}</s><b>{tk(qty * OFFER.offerPrice)}</b></span></div>
                  {ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => (
                    <div key={a.key} className="line line-add"><span>{a.name} {bn(addonQty[a.key] * a.pcs)} পিস</span><b>{tk(addonQty[a.key] * a.price)}</b></div>
                  ))}
                  <div className="line"><span>মোট পিস</span><b>{bn(qty * OFFER.pcs + addonPcs)} পিস</b></div>
                  <div className="line"><span>ডেলিভারি চার্জ</span><span><s>{tk(NORMAL_DELIVERY)}</s><span className="free">ফ্রি</span></span></div>
                  <div className="line line-save"><span>আপনার সেভ</span><b>{tk(save)}</b></div>
                </div>
                <div className="grand"><span>সর্বমোট</span><b>{tk(total)}</b></div>
                <div className="sum-note">
                  <span><IconCash />পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</span>
                  <span><IconBox />সুরক্ষিত প্রিমিয়াম প্যাকেজিং</span>
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
                  <div className={`field${errors.email ? ' err' : ''}`}>
                    <label htmlFor="fEmail">ইমেইল <em>*</em></label>
                    <input id="fEmail" ref={reg('email')} onBlur={() => onFieldBlur('email')} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                    <div className="msg">সঠিক ইমেইল ঠিকানা দিন</div>
                  </div>
                  <div className={`field${errors.district ? ' err' : ''}`}>
                    <label htmlFor="fDistrict">জেলা <em>*</em></label>
                    <DistrictPicker id="fDistrict" ref={reg('district')} value={form.district} options={DISTRICT_NAMES} onSelect={(d) => setField('district', d)} onDismiss={() => onFieldBlur('district')} />
                    <div className="msg">তালিকা থেকে আপনার জেলা নির্বাচন করুন</div>
                  </div>
                  <div className={`field${errors.address ? ' err' : ''}`}>
                    <label htmlFor="fAddress">সম্পূর্ণ ঠিকানা <em>*</em></label>
                    <textarea id="fAddress" ref={reg('address')} onBlur={() => onFieldBlur('address')} autoComplete="street-address" placeholder="বাসা/রোড, এলাকা, থানা" value={form.address} onChange={(e) => setField('address', e.target.value)} />
                    <div className="msg">ঠিকানা কমপক্ষে ৫ অক্ষরের লিখুন</div>
                  </div>
                  <div className="field">
                    <label htmlFor="fNote">বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                    <input id="fNote" value={form.note} onChange={(e) => setField('note', e.target.value)} />
                  </div>
                </div>

                <button type="submit" className={`btn btn-primary submit${sending ? ' loading' : ''}`} disabled={sending}>
                  <span className="spinner" />
                  <span className="btn-ico" style={{ display: 'inline-flex' }}><IconCheck w={2.2} /></span>
                  <span>অর্ডার কনফার্ম করুন</span>
                </button>
                <div className={`form-err${failed ? ' show' : ''}`}>দুঃখিত, অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন, অথবা <a href={failed || '#'} target="_blank" rel="noopener noreferrer">WhatsApp-এ অর্ডার দিন</a>।</div>
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
              <details open><summary>প্যাকেজিং কি নিরাপদ ও সুরক্ষিত হবে?</summary><p>হ্যাঁ। আমরা প্রতিটি অর্ডার মজবুত ও প্রিমিয়াম প্যাকেজিংয়ে পাঠাই, যাতে কুরিয়ার বা হোম ডেলিভারিতে পণ্যের কোনো ড্যামেজ না হয়।</p></details>
              <details><summary>পেমেন্ট কীভাবে করব?</summary><p>ক্যাশ অন ডেলিভারি। প্রোডাক্ট হাতে পেয়ে ডেলিভারিম্যানকে টাকা দেবেন, আগে কিছু দিতে হবে না।</p></details>
              <details><summary>ডেলিভারি চার্জ কত?</summary><p>এই অফারে ডেলিভারি সম্পূর্ণ ফ্রি, ঢাকার ভেতরে (সাধারণত ৳৭০) এবং ঢাকার বাইরে (সাধারণত ৳১২০) দুই জায়গাতেই।</p></details>
              <details><summary>অর্ডারের পর কী হবে?</summary><p>আমাদের টিম আপনার দেওয়া নম্বরে কল করে অর্ডার কনফার্ম করবে এবং ডেলিভারির সময় জানিয়ে দেবে।</p></details>
              <details><summary>তিন ধরনের মধ্যে পার্থক্য কী?</summary><p>Smart Pack-এ MO White, MO Pink এবং MO Blue — তিনটি ভ্যারিয়েন্টই ৬ পিস করে আছে, তাই ট্রাই করে নিজেই বুঝতে পারবেন কোনটা আপনার পছন্দ।</p></details>
            </div>
          </div>
        </section>

        <section className="sec final">
          <div className="container">
            <h2>৩ ধরনের MO, ১৮ পিস, মাত্র <span>৳৭২০</span></h2>
            <p>ফ্রি ডেলিভারি · ক্যাশ অন ডেলিভারি · প্রিমিয়াম প্যাকেজিং</p>
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

      <a className="wa-float" href={waOrderLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp-এ মেসেজ দিন"><IconWa /></a>

      <div className={`sticky${showSticky ? ' show' : ''}`}>
        <div className="sp"><b>৳৭২০</b><small><s>৳৮১০</s> ফ্রি ডেলিভারি</small></div>
        <a href="#order" onClick={onOrderClick} className="btn btn-primary">অর্ডার করুন</a>
      </div>

      <div className={`modal${success ? ' show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="okTitle" onClick={(e) => { if (e.target === e.currentTarget) setSuccess(null); }}>
        <div className="modal-box">
          <div className="tick"><IconCheck w={2.6} /></div>
          <h3 id="okTitle">ধন্যবাদ, অর্ডার পেয়েছি!</h3>
          <p>আমাদের টিম শীঘ্রই <b>{success ? bn(success.phone) : ''}</b> নম্বরে কল করে আপনার অর্ডার কনফার্ম করবে। ফোনটা কাছে রাখুন।</p>
          {success?.orderNumber ? <div className="order-id">অর্ডার আইডি: <b>{success.orderNumber}</b></div> : null}
          <button type="button" className="btn btn-primary" onClick={() => setSuccess(null)}>ঠিক আছে</button>
        </div>
      </div>
    </>
  );
};

export default SpecialOfferView;
