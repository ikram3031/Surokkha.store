import React, { useEffect, useMemo, useRef, useState } from 'react';
import './specialOffer.css';
import DistrictPicker from './SpecialOfferDistrictPicker.jsx';
import logoImg from '../asset/surokkha_logo_dark.png';
import { SITE_CONFIG } from '../config/siteConfig';
import { DISTRICTS } from '../data/districts';
import { getDeliveryCharge } from '../utils/deliveryCharge';
import { forgotPassword, verifyEmail } from '../utils/customerAuth';
import { trackSitePage, trackProductEvents } from '../utils/analytics';
import { sendOrder, trackOrderPlaced, useCheckoutLead } from '../checkout-core';

const PACKS = [
  {
    key: '12',
    did: 'd5a81e97721c8101',
    slug: 'mo-smart-pack-18-pcs',
    name: 'MO 3-in-1 Smart Pack (12 Pcs)',
    titleBn: '১২ পিস',
    boxLabelBn: '১২ পিসের বক্স',
    subBn: 'MO White ৪ + MO Pink ৪ + MO Blue ৪',
    perVariant: 4,
    pcs: 12,
    regularPrice: 540,
    offerPrice: 450,
    freeDelivery: false,
    maxQty: 5,
  },
  {
    key: '18',
    did: 'd5a81e97721c8101',
    slug: 'mo-smart-pack-18-pcs',
    name: 'MO 3-in-1 Smart Pack (18 Pcs)',
    titleBn: '১৮ পিস',
    boxLabelBn: '১৮ পিসের বক্স',
    subBn: 'MO White ৬ + MO Pink ৬ + MO Blue ৬',
    perVariant: 6,
    pcs: 18,
    regularPrice: 900,
    offerPrice: 800,
    freeDelivery: true,
    maxQty: 5,
  },
  {
    key: '30',
    did: 'd5a81e97721c8101',
    slug: 'mo-smart-pack-18-pcs',
    name: 'MO 3-in-1 Smart Pack (30 Pcs)',
    titleBn: '৩০ পিস',
    boxLabelBn: '৩০ পিসের বক্স',
    subBn: 'MO White ১০ + MO Pink ১০ + MO Blue ১০',
    perVariant: 10,
    pcs: 30,
    regularPrice: 1350,
    offerPrice: 980,
    freeDelivery: false,
    maxQty: 5,
  },
];

const ADDONS = [
  { key: 'ky', did: '5f3afc27eaaef962', slug: 'ky-jelly-personal-lubricant-gel-50g', name: 'KY Gel', fullName: 'KY Jelly Personal Lubricant Gel 50g', pcs: 1, price: 330, img: 'skh-i-ky', color: '#0ea5e9', itemType: 'item', size: '50g Tube' },
  { key: 'durex', sku: 'GC-ADDON-02', name: 'Durex Bubblegum', fullName: 'Durex Bubblegum 3 Pcs', pcs: 3, price: 120, color: '#f472b6', itemType: 'custom', size: 'Special Offer Add-on (3 Pcs)' },
  { key: 'skore', sku: 'GC-ADDON-03', name: 'Skore Not Out', fullName: 'Skore Not Out 3 Pcs', pcs: 3, price: 120, color: '#a855f7', itemType: 'custom', size: 'Special Offer Add-on (3 Pcs)' },
  { key: 'amore', sku: 'GC-ADDON-04', name: 'Amore Gold', fullName: 'Amore Gold 3 Pcs', pcs: 3, price: 100, color: '#eab308', itemType: 'custom', size: 'Special Offer Add-on (3 Pcs)' },
];

// The neutral name and id Meta sees for every add-on, so no product names reach the pixel
const META_ADDON_NAME = 'Gift Combo Add-on';
const metaAddonId = (a) => a.did || a.sku;
const EMPTY_ADDONS = Object.fromEntries(ADDONS.map((a) => [a.key, 0]));

const DEFAULT_PACK = PACKS[1];
const MAX_ADDON = 5;
const FREE_DELIVERY_MIN = 1500;
const WHATSAPP = '8801600905774';
const PHONE_DISPLAY = '01600-905774';
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
  const key = `_sk_pv_${DEFAULT_PACK.slug}`;
  try {
    const last = Number(window.sessionStorage.getItem(key) || 0);
    if (last && Date.now() - last < 30 * 60 * 1000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch (_) { return; }
  trackProductEvents([{ eventType: 'view', productKey: DEFAULT_PACK.slug, productName: DEFAULT_PACK.name }]);
};

// Builds a WhatsApp chat link with a prefilled message
const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

// Sends a Meta pixel event when the pixel is loaded
const track = (ev, data) => {
  try { if (window.fbq) window.fbq('track', ev, data); } catch (_) { return; }
};

// Adds the template fonts to the document head once
const useCampaignFonts = () => {
  useEffect(() => {
    document.title = 'MO 3-in-1 Smart Pack | Surokkha';
    if (document.getElementById('so-fonts')) return;
    const link = document.createElement('link');
    link.id = 'so-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,800;1,700&display=swap';
    document.head.appendChild(link);
  }, []);
};

// Renders a shopping cart icon
const IconCart = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>);

// Renders a check mark icon
const IconCheck = ({ w = 2.4 }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);

// Renders a delivery truck icon
const IconTruck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>);

// Renders a shield icon
const IconShield = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);

// Renders a package box icon
const IconBox = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/></svg>);

// Renders a WhatsApp icon
const IconWa = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>);

// Renders five stacked pack images for the hero visual
const Stack = ({ cls, img }) => (
  <div className={`stack ${cls}`}>
    {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`skh-img ${img}`} />)}
  </div>
);

const EMPTY_FORM = { name: '', phone: '', email: '', district: '', address: '', note: '' };

// Standalone MO Smart Pack campaign page with multi-pack options, add-ons, and OTP discount verification
const SpecialOfferView = () => {
  useCampaignFonts();
  const [packKey, setPackKey] = useState('18');
  const [qty, setQty] = useState(1);
  const [addonQty, setAddonQty] = useState(EMPTY_ADDONS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState('');
  const [blockedPhone, setBlockedPhone] = useState(null);
  const [success, setSuccess] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpErr, setOtpErr] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const startedRef = useRef(false);
  const cartedRef = useRef(false);
  const heroRef = useRef(null);
  const orderRef = useRef(null);
  const fieldRefs = useRef({});
  const touchedRef = useRef({});

  const activePack = PACKS.find((p) => p.key === packKey) || DEFAULT_PACK;
  const phoneBlocked = blockedPhone && blockedPhone.phone === cleanPhone(form.phone) ? blockedPhone : null;

  const addonTotal = ADDONS.reduce((s, a) => s + addonQty[a.key] * a.price, 0);
  const addonPcs = ADDONS.reduce((s, a) => s + addonQty[a.key] * a.pcs, 0);
  const sub = qty * activePack.offerPrice + addonTotal;
  const isFreeDelivery = Boolean(activePack.freeDelivery || sub >= FREE_DELIVERY_MIN);
  const hasDeliveryInfo = Boolean(form.district && form.address.trim());
  const deliveryCharge = isFreeDelivery ? 0 : (hasDeliveryInfo ? getDeliveryCharge(form.district, form.address) : 0);
  const total = sub + deliveryCharge;

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
      { slug: activePack.slug, name: activePack.name, quantity: qty, unitPrice: activePack.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ slug: a.slug || a.sku, name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price })),
    ],
  });
  useCheckoutLead(() => leadRef.current(), [form.name, form.phone, form.email, form.address, form.district, packKey, qty, addonQty], submittingRef);

  const waOrderLink = useMemo(() => waLink(`আমি ${activePack.name} অর্ডার করতে চাই।`), [activePack.name]);

  useEffect(() => {
    trackSitePage('special-offer');
    trackSmartPackView();
    track('ViewContent', { content_ids: [DEFAULT_PACK.did], content_type: 'product', content_name: DEFAULT_PACK.name, value: DEFAULT_PACK.offerPrice, currency: 'BDT' });
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
      track('AddToCart', { value: a.price, currency: 'BDT', content_ids: [metaAddonId(a)], content_name: META_ADDON_NAME, content_type: 'product' });
      trackProductEvents([{ eventType: 'add_to_cart', productKey: a.slug || a.sku, productName: a.fullName, quantity: 1, value: a.price }]);
    }
  };

  // Selects a pack option from the box breakdown section and scrolls to checkout
  const chooseBoxPack = (key) => {
    setPackKey(key);
    orderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Asks the backend whether a complete phone number is on the spam / fake list
  const checkPhoneListed = async (raw) => {
    const phone = cleanPhone(raw);
    if (!FIELD_OK.phone(phone)) return;
    try {
      const base = (SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch(`${base}/api/v1/orders/check-phone?phone=${encodeURIComponent(phone.slice(-10))}`);
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
    track('AddToCart', { value: activePack.offerPrice, currency: 'BDT', content_ids: [activePack.did], content_name: activePack.name, content_type: 'product' });
    trackProductEvents([{ eventType: 'add_to_cart', productKey: activePack.slug, productName: activePack.name, quantity: 1, value: activePack.offerPrice }]);
  };

  // Fires InitiateCheckout the first time the form gets focus
  const onFormFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('InitiateCheckout', { value: total, currency: 'BDT', content_ids: [activePack.did], content_type: 'product' });
    trackProductEvents([
      { eventType: 'checkout', productKey: activePack.slug, productName: activePack.name, quantity: qty, value: qty * activePack.offerPrice },
      ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({ eventType: 'checkout', productKey: a.slug || a.sku, productName: a.fullName, quantity: addonQty[a.key], value: addonQty[a.key] * a.price })),
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
    { productDid: activePack.did, itemType: 'product', name: activePack.name, quantity: qty, unitPrice: activePack.offerPrice, size: `${activePack.pcs} Pcs Special Offer` },
    ...ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => ({
      ...(a.did ? { productDid: a.did } : { sku: a.sku }), itemType: a.itemType || 'product', name: a.fullName, quantity: addonQty[a.key], unitPrice: a.price, size: a.size || 'Special Offer Add-on (2 Pcs)',
    })),
  ];

  // Builds a WhatsApp fallback message from the current order
  const fallbackLink = (v) => waLink(
    `অর্ডার: ${activePack.name} × ${qty}${ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => `\n+ ${a.fullName} × ${addonQty[a.key]}`).join('')}\nনাম: ${v.name}\nফোন: ${v.phone}\nইমেইল: ${v.email}\nজেলা: ${v.district}\nঠিকানা: ${v.address}\nমোট: ৳${total}`,
  );

  // Sends the order to the shop order API and triggers membership OTP verification email
  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setFailed('');
    const v = validate();
    if (!v) return;
    const finalDelivery = isFreeDelivery ? 0 : getDeliveryCharge(v.district, v.address);
    const finalTotal = sub + finalDelivery;
    const orderNoteTag = isFreeDelivery
      ? `Special offer page (${activePack.pcs} pcs - free delivery)`
      : `Special offer page (${activePack.pcs} pcs)`;
    const payload = {
      billingInfo: { fullName: v.name, phone: v.phone, email: v.email, address: v.address, city: v.district, thana: '', district: v.district, state: v.district, division: v.district, zip: '' },
      shippingInfo: null,
      shipToDifferentAddress: false,
      orderNotes: [form.note.trim(), orderNoteTag].filter(Boolean).join(' | '),
      subtotal: sub,
      shippingFee: finalDelivery,
      shippingTotalAmount: finalDelivery,
      discountTotalAmount: 0,
      couponCode: null,
      total: finalTotal,
      items: buildItems(),
    };
    setSending(true);
    submittingRef.current = true;
    try {
      const result = await sendOrder(payload);
      if (result.reason === 'contact_required') {
        setBlockedPhone({ phone: v.phone, message: SPAM_PHONE_MSG });
        fieldRefs.current.phone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!result.ok) throw new Error(result.message);
      const { orderNumber } = result;
      const json = { data: result.data };
      if (orderNumber) {
        const items = { [activePack.did]: qty };
        const products = { [activePack.did]: { did: activePack.did, slug: activePack.slug, name: activePack.name, price: activePack.offerPrice } };
        ADDONS.forEach((a) => {
          if (addonQty[a.key] > 0) {
            items[metaAddonId(a)] = addonQty[a.key];
            products[metaAddonId(a)] = { did: metaAddonId(a), slug: a.slug || a.sku, name: META_ADDON_NAME, price: a.price };
          }
        });
        trackOrderPlaced({
          orderNumber,
          items,
          totals: { subtotal: sub, grandTotal: finalTotal },
          customer: { name: v.name, mobile: v.phone, email: v.email, district: v.district, address: v.address },
        }, products, result.asLead);
      }
      const discountAmount = Number(json?.data?.memberBonus?.amount) || Math.round(sub * 0.05);
      setOtpCode('');
      setOtpErr('');
      setOtpSentMsg('');
      setOtpVerified(false);
      setSuccess({
        phone: v.phone,
        email: v.email,
        orderNumber,
        total: finalTotal,
        sub,
        discountAmount,
        discountedTotal: Math.max(0, finalTotal - discountAmount),
      });
      forgotPassword(v.email).catch(() => null);
      setForm(EMPTY_FORM);
      touchedRef.current = {};
      setQty(1);
      setAddonQty(EMPTY_ADDONS);
    } catch (err) {
      setFailed(fallbackLink(v));
    } finally {
      setSending(false);
      submittingRef.current = false;
    }
  };

  // Verifies the 6-digit OTP code from the customer's email to unlock the extra 5% discount
  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpBusy || !success?.email) return;
    const cleanOtp = toEnDigits(otpCode).replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpErr('আপনার ইমেইলে পাঠানো ৬ ডিজিটের ওটিপি কোডটি দিন।');
      return;
    }
    setOtpBusy(true);
    setOtpErr('');
    try {
      await verifyEmail({ email: success.email, otp: cleanOtp });
      setOtpVerified(true);
      setOtpSentMsg('');
    } catch (err) {
      setOtpErr(err?.message || 'ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।');
    } finally {
      setOtpBusy(false);
    }
  };

  // Resends the 6-digit OTP verification email for the current order
  const onResendOtp = async () => {
    if (otpBusy || !success?.email) return;
    setOtpBusy(true);
    setOtpErr('');
    setOtpSentMsg('');
    try {
      await forgotPassword(success.email);
      setOtpSentMsg('আপনার ইমেইলে নতুন ওটিপি কোড পাঠানো হয়েছে।');
    } catch (err) {
      setOtpErr(err?.message || 'ওটিপি পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setOtpBusy(false);
    }
  };

  // Registers a form control so validation can focus it
  const reg = (k) => (el) => { fieldRefs.current[k] = el; };

  return (
    <>
      <div className="topbar">স্পেশাল অফার: <b>MO 3-in-1 Smart Pack</b> — এক বক্সে ৩ ভ্যারিয়েন্ট · সারা বাংলাদেশে হোম ডেলিভারি</div>

      <header className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-logo"><img src={logoImg} alt="Surokkha" /></div>
          <div className="hero-grid">
            <div>
              <span className="eyebrow"><b>NEW</b> MO প্রথমবার? এই প্যাক দিয়ে শুরু করুন</span>
              <div className="brandline">MO Personal Care</div>
              <h1 className="hero-title">Smart <em>Pack</em></h1>
              <p className="hero-sub">একই কম্বোতে <strong>MO-এর তিনটি ভ্যারিয়েন্ট</strong>: MO White, MO Pink এবং MO Blue। <strong>২৫% পর্যন্ত ছাড়!</strong></p>

              <div className="ctas">
                <a href="#order" onClick={onOrderClick} className="btn btn-primary"><IconCart />এখনই অর্ডার করুন</a>
                <a href="#inside" className="btn btn-ghost">অপশন বেছে নিন</a>
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
              <span className="count c-white"><i style={{ background: '#f1f5f9' }} />MO White</span>
              <span className="count c-pink"><i style={{ background: '#f4a7c4' }} />MO Pink</span>
              <span className="count c-blue"><i style={{ background: '#38bdf8' }} />MO Blue</span>
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
              <h2 className="sec-title">৩ ধরনের MO</h2>
            </div>
            <div className="inside-grid">
              <div className="photo skh-i-photo" role="img" aria-label="MO Smart Pack-এর প্যাকেটসমূহ">
                <div className="photo-badge">MO 3-in-1 Smart Pack<small>১২, ১৮ ও ৩০ পিস · ৩ ভ্যারিয়েন্ট</small></div>
              </div>
              <div className="variants">
                <div className="variants-cols">
                  <div className="variant-col">
                    <div className="v-img skh-img skh-i-white" style={{ '--bg': '#eef1f6' }} />
                    <div className="v-name"><i style={{ background: '#f1f5f9' }} />MO White</div>
                  </div>
                  <div className="variant-col">
                    <div className="v-img skh-img skh-i-pink" style={{ '--bg': '#fde7ef' }} />
                    <div className="v-name"><i style={{ background: '#f4a7c4' }} />MO Pink</div>
                  </div>
                  <div className="variant-col">
                    <div className="v-img skh-img skh-i-blue" style={{ '--bg': '#e0f2fe' }} />
                    <div className="v-name"><i style={{ background: '#38bdf8' }} />MO Blue</div>
                  </div>
                </div>
                <div className="box-options">
                  {PACKS.map((p) => (
                    <button key={p.key} type="button" className={`box-opt${packKey === p.key ? ' on' : ''}`} onClick={() => chooseBoxPack(p.key)}>
                      <div>
                        <div className="box-title">{p.boxLabelBn}</div>
                        <div className="box-sub">{p.subBn}</div>
                      </div>
                      <span className="box-pcs">{tk(p.offerPrice)}</span>
                    </button>
                  ))}
                </div>
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
                <div className="pack-pick">
                  <div className="pack-pick-head">প্যাক অপশন বেছে নিন <small>(যেকোনো ১টি)</small></div>
                  <div className="pack-list">
                    {PACKS.map((p) => {
                      const active = packKey === p.key;
                      return (
                        <label key={p.key} className={`pack-opt${active ? ' on' : ''}`}>
                          <input type="checkbox" checked={active} onChange={() => setPackKey(p.key)} />
                          <span className="pack-box" aria-hidden="true">{active ? <IconCheck w={2.8} /> : null}</span>
                          <span className="pack-info">
                            <strong>{p.titleBn}</strong>
                          </span>
                          <span className="pack-price">{tk(p.offerPrice)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="qty">
                  <label htmlFor="qtyOut">পরিমাণ (বক্স)</label>
                  <div className="qty-ctl">
                    <button type="button" aria-label="কমান" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <output id="qtyOut">{bn(qty)}</output>
                    <button type="button" aria-label="বাড়ান" onClick={() => setQty((q) => Math.min(activePack.maxQty, q + 1))}>+</button>
                  </div>
                </div>
                <div className="addons">
                  <div className="addons-head">সাথে আরও নিন <small>অফার মূল্যে</small></div>
                  <div className="addon-list">
                    {ADDONS.map((a) => {
                      const n = addonQty[a.key];
                      return (
                        <div key={a.key} className={`addon${n > 0 ? ' on' : ''}`}>
                          <div className={`addon-img skh-img ${a.img || ''}`} style={a.img ? undefined : { background: a.color }} />
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
                  <div className="line"><span>দাম ({bn(qty)} × {tk(activePack.offerPrice)})</span><b>{tk(qty * activePack.offerPrice)}</b></div>
                  {ADDONS.filter((a) => addonQty[a.key] > 0).map((a) => (
                    <div key={a.key} className="line line-add"><span>{a.name} {bn(addonQty[a.key] * a.pcs)} পিস</span><b>{tk(addonQty[a.key] * a.price)}</b></div>
                  ))}
                  <div className="line"><span>মোট পিস</span><b>{bn(qty * activePack.pcs + addonPcs)} পিস</b></div>
                  {isFreeDelivery ? (
                    <div className="line"><span>ডেলিভারি চার্জ</span><span className="free">ফ্রি</span></div>
                  ) : hasDeliveryInfo ? (
                    <div className="line"><span>ডেলিভারি চার্জ</span><b>{tk(deliveryCharge)}</b></div>
                  ) : null}
                </div>
                <div className="grand">
                  <span>সর্বমোট</span>
                  <b>
                    {tk(total)}
                    {!isFreeDelivery && !hasDeliveryInfo ? <small className="grand-plus"> + ডেলিভারি চার্জ</small> : null}
                  </b>
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
                <p className="form-foot">অর্ডার করতে সমস্যা? কল বা WhatsApp করুন: <a href="tel:+8801600905774"><b>{PHONE_DISPLAY}</b></a></p>
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
              <details><summary>ডেলিভারি চার্জ কত?</summary><p>১৮ পিস Smart Pack অথবা ৳১,৫০০+ অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি। ১২ পিস ও ৩০ পিস প্যাকে ঢাকার ভেতরে ৳৭০ এবং ঢাকার বাইরে ৳১২০ ডেলিভারি চার্জ প্রযোজ্য।</p></details>
              <details><summary>অর্ডারের পর কী হবে?</summary><p>আমাদের টিম আপনার দেওয়া নম্বরে কল করে অর্ডার কনফার্ম করবে এবং ডেলিভারির সময় জানিয়ে দেবে।</p></details>
              <details><summary>তিন ধরনের মধ্যে পার্থক্য কী?</summary><p>Smart Pack-এ MO White, MO Pink এবং MO Blue — তিনটি ভ্যারিয়েন্টই সমান পিসে (৪, ৬ বা ১০ পিস করে) আছে, তাই ট্রাই করে নিজেই বুঝতে পারবেন কোনটা আপনার পছন্দ।</p></details>
            </div>
          </div>
        </section>

        <section className="sec final">
          <div className="container">
            <h2>৩ ধরনের MO, এক বক্সে <span>Smart Pack</span></h2>
            <p>১২ পিস, ১৮ পিস বা ৩০ পিস · ক্যাশ অন ডেলিভারি · প্রিমিয়াম প্যাকেজিং</p>
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
          <span>কল / WhatsApp: <a href="tel:+8801600905774">{PHONE_DISPLAY}</a></span>
          <span>© {bn(new Date().getFullYear())} Surokkha. সর্বস্বত্ব সংরক্ষিত।</span>
        </div>
      </footer>

      <a className="wa-float" href={waOrderLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp-এ মেসেজ দিন"><IconWa /></a>

      <div className={`sticky${showSticky ? ' show' : ''}`}>
        <div className="sp"><b>MO 3-in-1 Smart Pack</b><small>১২ / ১৮ / ৩০ পিস প্যাক</small></div>
        <a href="#order" onClick={onOrderClick} className="btn btn-primary">অর্ডার করুন</a>
      </div>

      <div className={`modal${success ? ' show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="okTitle" onClick={(e) => { if (e.target === e.currentTarget) setSuccess(null); }}>
        <div className="modal-box">
          <div className="tick"><IconCheck w={2.6} /></div>
          <h3 id="okTitle">ধন্যবাদ, অর্ডার পেয়েছি!</h3>
          <p>আমাদের টিম শীঘ্রই <b>{success ? bn(success.phone) : ''}</b> নম্বরে কল করে আপনার অর্ডার কনফার্ম করবে। ফোনটা কাছে রাখুন।</p>
          {success?.orderNumber ? <div className="order-id">অর্ডার আইডি: <b>{success.orderNumber}</b></div> : null}

          {success?.email ? (
            <div className="otp-card">
              {otpVerified ? (
                <div className="otp-ok">
                  <b>মেম্বারশিপ ভেরিফাইড! আপনার অর্ডারে অতিরিক্ত ৫% ({tk(success.discountAmount)}) ছাড় যুক্ত হয়েছে।</b>
                  <p>খুব শীঘ্রই আপনার আপডেটেড প্রাইসিং আপনাকে জানানো হবে।</p>
                </div>
              ) : (
                <form onSubmit={onVerifyOtp}>
                  <h4>আপনার মেম্বারশিপ কনফার্ম করে অতিরিক্ত ৫% ছাড় নিন</h4>
                  <p className="otp-desc">
                    আপনার {tk(success.total)} অর্ডারে আরও <b>{tk(success.discountAmount)}</b> ছাড় পাবেন (ছাড়ের পর মোট: <b>{tk(success.discountedTotal)}</b>)।
                  </p>
                  <p className="otp-email">
                    <b>{success.email}</b> ইমেইলে পাঠানো ৬ ডিজিটের ওটিপি (OTP) কোডটি দিন:
                  </p>
                  <div className="otp-row">
                    <input
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="৬ ডিজিটের ওটিপি"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary otp-btn" disabled={otpBusy}>
                      {otpBusy ? 'যাচাই হচ্ছে...' : 'ওটিপি ভেরিফাই করুন'}
                    </button>
                  </div>
                  {otpErr ? <div className="otp-err">{otpErr}</div> : null}
                  {otpSentMsg ? <div className="otp-sent">{otpSentMsg}</div> : null}
                  <button type="button" className="otp-resend" onClick={onResendOtp} disabled={otpBusy}>
                    আবার ওটিপি পাঠান
                  </button>
                </form>
              )}
            </div>
          ) : null}

          <button type="button" className="btn btn-primary" onClick={() => setSuccess(null)}>ঠিক আছে</button>
        </div>
      </div>
    </>
  );
};

export default SpecialOfferView;
