import { create } from 'zustand';
import { PRODUCTS as DEFAULT_PRODUCTS, PRODUCT_KEYS as DEFAULT_PRODUCT_KEYS } from '../data/products';
import { SITE_CONFIG } from '../config/siteConfig';
import {
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackAddComboToCart,
  trackPurchase,
  getFbp,
  getFbc,
  getExternalId,
  syncMetaUserProperties
} from '../utils/analytics';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl;

// Parse initial view and slug from real browser URL pathname
export const parseRouteFromLocation = () => {
  if (typeof window === 'undefined') return { view: 'home', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';

  if (pathname === '/' || pathname === '') {
    return { view: 'home', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/offers' || pathname === '/shop/offers' || pathname === '/shop/combo' || pathname === '/combo' || pathname === '/products/combo' || pathname.startsWith('/shop/combo') || pathname.startsWith('/offers')) {
    return { view: 'combo', slug: 'mo-micro-thin-latex-contraceptive-20-pcs-combo' };
  }
  if (pathname === '/shop' || pathname === '/products' || pathname === '/store') {
    return { view: 'shop', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/cart') {
    return { view: 'home', slug: 'mo-multi-textured-latex-contraceptive-10-pcs', openCart: true };
  }
  if (pathname === '/checkout') {
    return { view: 'checkout', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/confirmation') {
    return { view: 'confirmation', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/terms' || pathname === '/terms-and-conditions' || pathname === '/terms-conditions' || pathname === '/tos') {
    return { view: 'terms', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/privacy' || pathname === '/privacy-policy') {
    return { view: 'privacy', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/refund' || pathname === '/return-and-refund' || pathname === '/return-refund' || pathname === '/refund-policy' || pathname === '/returns') {
    return { view: 'refund', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/faq' || pathname === '/faqs' || pathname === '/help') {
    return { view: 'faq', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }
  if (pathname === '/contact' || pathname === '/contact-us' || pathname === '/support') {
    return { view: 'contact', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
  }

  // Handle /product/:slug or /products/:slug dynamically
  if (pathname.startsWith('/product/') || pathname.startsWith('/products/')) {
    const parts = pathname.split('/').filter(Boolean);
    const slug = parts[1];
    if (slug) return { view: 'product', slug };
  }

  // Handle /shop/:category/:slug or /shop/:slug dynamically
  if (pathname.startsWith('/shop/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 3) {
      const slug = parts[2];
      return { view: 'product', slug };
    } else if (parts.length === 2) {
      const segment = parts[1];
      const categories = ['all', 'wellness', 'contraceptive', 'combo', 'combo-pack', 'contraceptive-barrier-device'];
      if (!categories.includes(segment)) {
        return { view: 'product', slug: segment };
      }
      return { view: 'shop', slug: segment };
    }
  }

  return { view: 'home', slug: 'mo-multi-textured-latex-contraceptive-10-pcs' };
};

const initialRoute = parseRouteFromLocation();

// Initialize and persist default language (always Bangla)
export const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('surokkha_lang', 'bn');
    } catch (e) { }
  }
  return 'bn';
};

export const useStore = create((set, get) => ({
  currentView: initialRoute.view,
  selectedProductSlug: initialRoute.slug,
  currentSlide: 0,
  cart: {},
  lastOrder: null,
  toast: { show: false, message: '' },

  // Interactive Slide-Over Cart Drawer State & Actions
  isCartDrawerOpen: Boolean(initialRoute.openCart),
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  language: getInitialLanguage(),
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('surokkha_lang', lang);
      } catch (e) { }
    }
    set({ language: lang });
  },
  toggleLanguage: () => {
    const next = get().language === 'bn' ? 'en' : 'bn';
    get().setLanguage(next);
  },

  // Checkout States (Matching Decantre Architecture)
  sameAsBilling: true,
  orderNotes: '',
  paymentMethod: 'cod',
  shippingInfo: {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    thana: '',
    district: '',
    zip: ''
  },
  shippingAddress: {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    thana: '',
    district: '',
    zip: ''
  },

  setSameAsBilling: (same) => set({ sameAsBilling: same }),
  setOrderNotes: (notes) => set({ orderNotes: notes }),
  setShippingInfo: (updater) => set((state) => {
    const updated = typeof updater === 'function' ? updater(state.shippingInfo) : { ...state.shippingInfo, ...updater };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (updated.phone) window.localStorage.setItem('_sk_user_phone', updated.phone);
        if (updated.email) window.localStorage.setItem('_sk_user_email', updated.email);
        if (updated.fullName) window.localStorage.setItem('_sk_user_name', updated.fullName);
        if (updated.district) window.localStorage.setItem('_sk_user_district', updated.district);
        syncMetaUserProperties(updated);
      } catch (_) { }
    }
    return { shippingInfo: updated };
  }),
  setShippingAddress: (updater) => set((state) => ({
    shippingAddress: typeof updater === 'function' ? updater(state.shippingAddress) : { ...state.shippingAddress, ...updater }
  })),

  // Coupon States & Actions
  appliedCoupon: null,
  couponCodeInput: '',
  couponError: '',
  isApplyingCoupon: false,
  setCouponCodeInput: (val) => set({ couponCodeInput: val, couponError: '' }),
  applyCoupon: async (codeToApply = null) => {
    const rawCode = codeToApply !== null ? codeToApply : get().couponCodeInput;
    const cleanCode = String(rawCode || '').trim().toUpperCase();
    const isBn = get().language === 'bn';

    if (!cleanCode) {
      set({ couponError: isBn ? 'অনুগ্রহ করে কুপন কোড লিখুন।' : 'Please enter a coupon code.' });
      return { success: false, message: isBn ? 'অনুগ্রহ করে কুপন কোড লিখুন।' : 'Please enter a coupon code.' };
    }

    set({ isApplyingCoupon: true, couponError: '' });
    try {
      // Special client-side handling for FREEOCT if API doesn't have it in DB yet
      if (cleanCode === 'FREEOCT') {
        const totals = get().getCartTotals();
        if (totals.subtotal < 1000) {
          const errMsg = isBn
            ? 'এই কুপনের জন্য সর্বনিম্ন ৳১,০০০ টাকার অর্ডার প্রয়োজন।'
            : 'Minimum purchase of ৳1,000 required for FREEOCT.';
          set({ couponError: errMsg, isApplyingCoupon: false });
          return { success: false, message: errMsg };
        }

        const freeOctCoupon = {
          code: 'FREEOCT',
          discountType: 'free_shipping',
          discountValue: 0,
          minOrderAmount: 1000,
          active: true,
          description: 'Free Shipping on orders ৳1,000+'
        };

        set({
          appliedCoupon: freeOctCoupon,
          couponCodeInput: cleanCode,
          couponError: '',
          isApplyingCoupon: false
        });

        const successMsg = isBn ? '🎉 কুপন "FREEOCT" প্রয়োগ করা হয়েছে! আপনি পাচ্ছেন ফ্রি ডেলিভারি!' : '🎉 Coupon "FREEOCT" applied! Free Delivery unlocked!';
        get().showToast(successMsg);
        return { success: true, message: successMsg };
      }

      const cleanBase = API_BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${cleanBase}/api/v1/coupons/${encodeURIComponent(cleanCode)}`);
      const json = await res.json();

      if (!res.ok || json.status !== 'success' || !json.data) {
        const errMsg = json.message || (isBn ? 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ।' : 'Invalid coupon code or expired.');
        set({ couponError: errMsg, isApplyingCoupon: false });
        return { success: false, message: errMsg };
      }

      const coupon = json.data;

      if (!coupon.active) {
        const errMsg = isBn ? 'কুপনটি বর্তমানে সক্রিয় নয়।' : 'Coupon is currently inactive.';
        set({ couponError: errMsg, isApplyingCoupon: false });
        return { success: false, message: errMsg };
      }

      const now = new Date();
      if (coupon.validFrom && now < new Date(coupon.validFrom)) {
        const errMsg = isBn ? 'কুপনের অফারটি এখনো শুরু হয়নি।' : 'Coupon promotion has not started yet.';
        set({ couponError: errMsg, isApplyingCoupon: false });
        return { success: false, message: errMsg };
      }
      if (coupon.validTo && now > new Date(coupon.validTo)) {
        const errMsg = isBn ? 'কুপনের মেয়াদ শেষ হয়ে গেছে।' : 'Coupon has expired.';
        set({ couponError: errMsg, isApplyingCoupon: false });
        return { success: false, message: errMsg };
      }

      const totals = get().getCartTotals();
      if (coupon.minOrderAmount && totals.subtotal < Number(coupon.minOrderAmount)) {
        const errMsg = isBn
          ? `এই কুপনের জন্য সর্বনিম্ন ৳${coupon.minOrderAmount} টাকার অর্ডার প্রয়োজন।`
          : `Minimum purchase of ৳${coupon.minOrderAmount} required.`;
        set({
          couponError: errMsg,
          isApplyingCoupon: false
        });
        return { success: false, message: errMsg };
      }

      set({
        appliedCoupon: coupon,
        couponCodeInput: cleanCode,
        couponError: '',
        isApplyingCoupon: false
      });

      const successMsg = isBn
        ? `🎉 কুপন "${cleanCode}" সফলভাবে প্রয়োগ করা হয়েছে!`
        : `🎉 Coupon "${cleanCode}" applied successfully!`;
      get().showToast(successMsg);
      return { success: true, message: successMsg };
    } catch (err) {
      console.error('Error applying coupon:', err);
      const errMsg = isBn ? 'কুপন যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to verify coupon. Please try again.';
      set({
        couponError: errMsg,
        isApplyingCoupon: false
      });
      return { success: false, message: errMsg };
    }
  },
  removeCoupon: () => {
    const isBn = get().language === 'bn';
    set({ appliedCoupon: null, couponCodeInput: '', couponError: '' });
    get().showToast(isBn ? 'কুপন মুছে ফেলা হয়েছে।' : 'Coupon removed.');
  },

  // Dynamic Products State
  // Dynamic Products & Categories State
  products: DEFAULT_PRODUCTS,
  productKeys: DEFAULT_PRODUCT_KEYS,
  isLoadingProducts: false,
  productsError: null,
  categories: [],
  isLoadingCategories: false,

  fetchCategories: async () => {
    set({ isLoadingCategories: true });
    try {
      const endpoints = [
        '/api/v1/categories',
        `${API_BASE_URL}/api/v1/categories`,
        '/api/categories',
        `${API_BASE_URL}/api/categories`
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const json = await res.json();
            const cats = Array.isArray(json) ? json : (json.data || json.categories || []);
            if (Array.isArray(cats) && cats.length > 0) {
              set({ categories: cats, isLoadingCategories: false });
              return;
            }
          }
        } catch { }
      }
      set({ isLoadingCategories: false });
    } catch {
      set({ isLoadingCategories: false });
    }
  },

  // Fetch Dynamic Products from API with Multi-Language / data_bn Support
  fetchProducts: async () => {
    set({ isLoadingProducts: true, productsError: null });
    const currentLang = get().language || 'bn';
    try {
      const endpoints = [
        `/api/v1/products?isActive=true&limit=100&lang=${currentLang}`,
        `/api/v1/products?limit=100&lang=${currentLang}`,
        `${API_BASE_URL}/api/v1/products?isActive=true&limit=100&lang=${currentLang}`,
        `${API_BASE_URL}/api/v1/products?limit=100&lang=${currentLang}`,
        `/api/v1/products?isActive=true&limit=100`,
        `${API_BASE_URL}/api/v1/products?isActive=true&limit=100`,
        `/api/v1/products`,
        `${API_BASE_URL}/api/v1/products`,
        '/api/products',
        `${API_BASE_URL}/api/products`
      ];

      let rawData = null;
      let rawDataBn = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'Accept-Language': currentLang,
              'X-Language': currentLang
            }
          });
          if (res.ok) {
            const json = await res.json();

            if (json && typeof json === 'object') {
              rawDataBn = json.data_bn || json.products_bn || json.result_bn || null;
              rawData = Array.isArray(json) ? json : (json.data || json.products || json.result || json.items || []);
            }

            if (Array.isArray(rawData) && rawData.length > 0) {
              break;
            }
          }
        } catch {
          // try next endpoint
        }
      }

      if (rawData && rawData.length > 0) {
        const normalized = {};
        const keys = [];

        // Helper to extract timestamp for sorting
        const getCreatedTimestamp = (p) => {
          if (p.createdAt) {
            const t = new Date(p.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (p.createdDate) {
            const t = new Date(p.createdDate).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (p.created_at) {
            const t = new Date(p.created_at).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (p.updatedAt || p.updated_at) {
            const t = new Date(p.updatedAt || p.updated_at).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          const idStr = String(p.id || p._id || '');
          if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
            const hex = idStr.substring(0, 8);
            const ts = parseInt(hex, 16) * 1000;
            if (!isNaN(ts) && ts > 0) return ts;
          }
          return 0;
        };

        // Sort products: Active first -> Oldest CreatedDate first (original lineup at top, new arrivals at bottom)
        rawData.sort((a, b) => {
          const aIsActive = (a.isActive !== false && a.status !== 'inactive') ? 1 : 0;
          const bIsActive = (b.isActive !== false && b.status !== 'inactive') ? 1 : 0;
          if (aIsActive !== bIsActive) {
            return bIsActive - aIsActive; // Active first
          }

          const timeA = getCreatedTimestamp(a);
          const timeB = getCreatedTimestamp(b);
          // Items with no timestamp or earliest timestamp come first
          if (!timeA && timeB) return -1;
          if (timeA && !timeB) return 1;
          return timeA - timeB; // Oldest first
        });

        // Build a lookup map if rawDataBn is provided as an array or object
        const bnLookup = {};
        if (Array.isArray(rawDataBn)) {
          rawDataBn.forEach((item, idx) => {
            const k = item.slug || item.id || item.did || `product-${idx + 1}`;
            bnLookup[k] = item;
            bnLookup[idx] = item;
          });
        } else if (rawDataBn && typeof rawDataBn === 'object') {
          Object.entries(rawDataBn).forEach(([k, item]) => {
            bnLookup[k] = item;
          });
        }

        rawData.forEach((p, index) => {
          const key = p.slug || p.id || p.did || `product-${index + 1}`;
          keys.push(key);
          const rawPrice = Number(p.price || p.regularPrice || 0);
          const rawOffer = (p.offerPrice != null && Number(p.offerPrice) > 0) ? Number(p.offerPrice) : ((p.offer_price != null && Number(p.offer_price) > 0) ? Number(p.offer_price) : null);

          const resolvedRegularPrice = Number(p.regularPrice || p.regular_price || rawPrice || 0);
          const resolvedOfferPrice = rawOffer;
          const resolvedPrice = (resolvedOfferPrice && resolvedOfferPrice < resolvedRegularPrice) ? resolvedOfferPrice : (resolvedOfferPrice || resolvedRegularPrice);

          const resolveUrl = (img) => {
            if (img && typeof img === 'string') {
              const trimmed = img.trim();
              if (!trimmed || trimmed === '#' || trimmed === '/#' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
                return null;
              }
              if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
                return trimmed;
              }
              const cleanBase = API_BASE_URL.replace(/\/$/, '');
              const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
              return `${cleanBase}${cleanPath}`;
            }
            return null;
          };

          const rawPrimary = p.imageUrl || p.image || p.product_image || p.thumbnailUrl || (Array.isArray(p.images) ? p.images[0] : null) || null;
          const primaryImg = resolveUrl(rawPrimary);

          const rawGallery = Array.isArray(p.images) ? p.images : (Array.isArray(p.gallery_images) ? p.gallery_images : (Array.isArray(p.gallery) ? p.gallery : (Array.isArray(p.galleryImages) ? p.galleryImages : [])));
          let resolvedGallery = rawGallery.map(resolveUrl).filter(Boolean);
          if (primaryImg && !resolvedGallery.includes(primaryImg)) {
            resolvedGallery = [primaryImg, ...resolvedGallery];
          }

          // Extract Bengali data from p.bn, p.data_bn, bnLookup, or direct fields
          const itemBn = (p.bn && typeof p.bn === 'object')
            ? p.bn
            : ((p.data_bn && typeof p.data_bn === 'object') ? p.data_bn : (bnLookup[key] || bnLookup[index] || {}));

          const nameBn = itemBn.name || itemBn.title || p.name_bn || p.title_bn || p.name || 'ওয়েলনেস প্রোডাক্ট';
          const taglineBn = itemBn.tagline || itemBn.shortDescription || itemBn.subtitle || p.tagline_bn || p.shortDescription_bn || p.tagline || 'প্রিমিয়াম পার্সোনাল ওয়েলনেস স্ট্যান্ডার্ড';
          const descriptionBn = itemBn.description || itemBn.longDescription || p.description_bn || p.longDescription_bn || p.description || 'কঠোর মান নিয়ন্ত্রণে প্রস্তুত প্রিমিয়াম গোপনীয় ব্যক্তিগত যত্ন পণ্য।';

          const benefits = Array.isArray(p.benefits) && p.benefits.length > 0 ? p.benefits : [];
          const benefitsBn = Array.isArray(itemBn.benefits) && itemBn.benefits.length > 0 ? itemBn.benefits : benefits;

          const featuresBn = benefitsBn.length > 0
            ? benefitsBn.map(b => (typeof b === 'object' ? (b.title || b.description || '') : b)).filter(Boolean)
            : (Array.isArray(itemBn.features) && itemBn.features.length > 0
              ? itemBn.features
              : (Array.isArray(p.features_bn) && p.features_bn.length > 0 ? p.features_bn : ['সার্টিফাইড সেফটি স্ট্যান্ডার্ড', 'নিউট্রাল পিএইচ সিলিকন লুব্রিকেশন', 'ইলেকট্রনিক পরীক্ষায় প্রমাণিত স্থায়িত্ব']));

          const features = benefits.length > 0
            ? benefits.map(b => (typeof b === 'object' ? (b.title || b.description || '') : b)).filter(Boolean)
            : (Array.isArray(p.features) && p.features.length > 0 ? p.features : ['Certified safety standard', 'Neutral pH silicone lubrication', 'Electronically inspected durability']);

          const specs = (p.specifications && typeof p.specifications === 'object') ? p.specifications : (p.technicalSpecs || {});
          const specsBn = (itemBn.specifications && typeof itemBn.specifications === 'object') ? itemBn.specifications : specs;

          const packSize = p.packSize || (key.includes('30pcs') || key.includes('variety') ? '30 Pieces (3 Boxes)' : (key.includes('20pcs') || key.includes('combo') ? '20 Pieces (2 Boxes)' : '10 Pieces / Box'));
          const packSizeBn = itemBn.packSize || (key.includes('30pcs') || key.includes('variety') ? '৩০ পিস (৩টি বক্স)' : (key.includes('20pcs') || key.includes('combo') ? '২০ পিস (২টি বক্স)' : '১০ পিস প্রতি বক্স'));

          const packageContents = p.packageContents || (key.includes('30pcs') || key.includes('variety') ? '3 Sealed Retail Boxes (1x Ultra Thin 10pcs + 1x Dotted 10pcs + 1x Ribbed 10pcs = 30 Pcs Total)' : (key.includes('20pcs') || key.includes('combo') ? '2 Sealed Retail Boxes (20 Individual Foils)' : '1 Sealed Retail Box (10 Individual Foils)'));
          const packageContentsBn = itemBn.packageContents || (key.includes('30pcs') || key.includes('variety') ? '৩টি বক্স (১x আল্ট্রা থিন ১০ পিস + ১x ডটেড ১০ পিস + ১x আল্ট্রা রিবড ১০ পিস)' : (key.includes('20pcs') || key.includes('combo') ? '২টি বক্স (২০টি সিল্ড ইনডিভিজুয়াল ফয়েল প্যাক)' : '১টি সিল করা রিটেইল বক্স (১০টি ফয়েল)'));

          const productObj = {
            id: key,
            slug: key,
            did: p.did || key,
            _id: p._id || p.id,
            name: p.name || p.title || 'Wellness Product',
            name_bn: nameBn,
            bn: itemBn,
            data_bn: itemBn,
            brand: p.brand && typeof p.brand === 'string' ? p.brand : 'MO',
            origin: p.origin || 'Imported (  / CE Certified)',
            category: (p.category && typeof p.category === 'object' ? p.category.name : p.category) || (key.includes('combo') ? 'Combo' : 'Contraceptive'),
            categorySlug: (p.category && typeof p.category === 'object' ? p.category.slug : (p.category ? String(p.category).toLowerCase().replace(/\s+/g, '-') : '')) || (key.includes('combo') ? 'combo' : 'contraceptive'),
            category_bn: (p.category && typeof p.category === 'object' && p.category.name_bn) ? p.category.name_bn : (key.includes('combo') ? 'কম্বো প্যাক' : ((p.category?.name || p.category || '').toLowerCase().includes('lubricant') ? 'লুব্রিকেন্ট' : (p.category_bn || 'কনট্রাসেপটিভ'))),
            categories: Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []),
            price: resolvedPrice,
            regularPrice: resolvedRegularPrice,
            offerPrice: resolvedOfferPrice,
            salePrice: resolvedPrice < resolvedRegularPrice ? resolvedPrice : null,
            stockStatus: p.stockStatus || ((p.isOutOfStock || p.availability === 'out of stock' || (p.stockStatus !== 'instock' && (p.stockAmount === 0 || p.stock === 0))) ? 'outofstock' : 'instock'),
            isOutOfStock: Boolean(p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.availability === 'out of stock' || p.isOutOfStock === true || (p.stockStatus !== 'instock' && (p.stockAmount === 0 || p.stock === 0))),
            stockAmount: (p.stockAmount != null) ? Number(p.stockAmount) : ((p.stock != null) ? Number(p.stock) : (p.stockStatus === 'outofstock' ? 0 : 50)),
            isActive: p.isActive !== false && p.status !== 'inactive',
            createdAt: p.createdAt || p.created_at || p.createdDate || null,
            createdDate: p.createdDate || p.createdAt || p.created_at || p.updatedAt || p.updated_at || null,
            updatedAt: p.updatedAt || p.updated_at || null,
            createdTimestamp: getCreatedTimestamp(p),
            packSize: packSize,
            packSize_bn: packSizeBn,
            packageContents: packageContents,
            packageContents_bn: packageContentsBn,
            tagline: p.tagline || p.shortDescription || p.subtitle || 'Premium personal wellness standard',
            tagline_bn: taglineBn,
            description: p.description || p.longDescription || 'Premium discreet personal wellness product engineered under strict quality testing.',
            description_bn: descriptionBn,
            specifications: specs,
            specifications_bn: specsBn,
            technicalSpecs: specs,
            benefits: benefits,
            benefits_bn: benefitsBn,
            features: features,
            features_bn: featuresBn,
            badgeColor: p.badgeColor || (key.includes('dotted') ? 'bg-rose-50 text-rose-800 border-rose-200' : key.includes('ribbed') ? 'bg-purple-50 text-purple-900 border-purple-200' : key.includes('variety') ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-brand-50 text-brand-800 border-brand-200'),
            iconType: p.iconType || (key.includes('thin') ? 'thin' : key.includes('ribbed') ? 'ribbed' : key.includes('dotted') ? 'dotted' : key.includes('combo') ? 'combo' : (key.includes('gelly') || key.includes('jelly') || key.includes('lubricant') ? 'lubricant' : 'standard')),
            imageUrl: primaryImg,
            images: resolvedGallery.length > 0 ? resolvedGallery : (primaryImg ? [primaryImg] : []),
          };

          normalized[key] = productObj;

          // Add aliases for secondary lookups
          if (p.did) normalized[p.did] = productObj;
          if (p.id && p.id !== key) normalized[p.id] = productObj;
          if (p._id && p._id !== key) normalized[p._id] = productObj;
        });

        // Add legacy aliases mapping to new canonical slugs
        const legacyAliases = {
          'dotted-condoms-20pcs-combo': 'mo-multi-textured-latex-contraceptive-20-pcs-combo',
          'ribbed-condoms-20pcs-combo': 'mo-micro-ribbed-natural-latex-contraceptive-20-pcs-combo',
          'ultra-thin-condoms-20pcs-combo': 'mo-micro-thin-latex-contraceptive-20-pcs-combo',
          'variety-condoms-30pcs-combo': 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo',
          'combo-26': 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo',
          'mo-dotted-condom': 'mo-multi-textured-latex-contraceptive-10-pcs',
          'mo-dotted': 'mo-multi-textured-latex-contraceptive-10-pcs',
          'mo-ultra-thin-condom': 'mo-micro-thin-latex-contraceptive-10-pcs',
          'mo-ultra-thin': 'mo-micro-thin-latex-contraceptive-10-pcs',
          'mo-ultra-ribbed-condom': 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs',
          'mo-ultra-ribbed': 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs',
        };

        Object.entries(legacyAliases).forEach(([legacyKey, canonicalKey]) => {
          if (normalized[canonicalKey] && !normalized[legacyKey]) {
            normalized[legacyKey] = normalized[canonicalKey];
          }
        });

        const currentSlug = get().selectedProductSlug;
        const resolvedCurrent = (currentSlug && normalized[currentSlug]) ? (normalized[currentSlug].slug || currentSlug) : null;
        const finalSelectedSlug = resolvedCurrent || (keys[0] || 'mo-multi-textured-latex-contraceptive-20-pcs-combo');

        set({
          products: normalized,
          productKeys: keys,
          isLoadingProducts: false,
          selectedProductSlug: finalSelectedSlug
        });
      } else {
        set({ isLoadingProducts: false });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      set({ isLoadingProducts: false, productsError: err.message });
    }
  },

  // Navigation with true Browser URL History Sync
  navigateTo: (view, param = null, replaceHistory = false) => {
    // If cart navigation is requested, open the drawer instead of switching view
    if (view === 'cart') {
      get().openCartDrawer();
      return;
    }

    set((state) => {
      const updates = { currentView: view };
      if (view === 'product' && param) {
        updates.selectedProductSlug = param;
      }
      return updates;
    });

    if (typeof window !== 'undefined') {
      let targetPath = '/';
      if (view === 'product') {
        const rawSlug = param || get().selectedProductSlug || 'mo-multi-textured-latex-contraceptive-10-pcs';
        const productsMap = get().products || {};
        const prod = productsMap[rawSlug] || (typeof productsMap === 'object' && Object.values(productsMap).find(p => p.slug === rawSlug || p.id === rawSlug || p.did === rawSlug));
        const finalSlug = prod?.slug || rawSlug;
        targetPath = `/product/${finalSlug}`;
      } else if (view === 'shop') {
        targetPath = '/shop';
      } else if (view === 'combo' || view === 'offers') {
        targetPath = '/offers';
      } else if (view === 'checkout') {
        targetPath = '/checkout';
      } else if (view === 'confirmation') {
        targetPath = '/confirmation';
      } else if (view === 'terms') {
        targetPath = '/terms';
      } else if (view === 'privacy') {
        targetPath = '/privacy';
      } else if (view === 'refund') {
        targetPath = '/refund';
      } else if (view === 'faq') {
        targetPath = '/faq';
      } else if (view === 'contact') {
        targetPath = '/contact';
      }

      if (window.location.pathname !== targetPath) {
        if (replaceHistory) {
          window.history.replaceState({ view, param }, '', targetPath);
        } else {
          window.history.pushState({ view, param }, '', targetPath);
        }
      }
    }

    trackPageView(view, view === 'home' ? '/' : `/${view}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openProduct: (slug) => {
    get().navigateTo('product', slug);
    const prod = get().products[slug];
    if (prod) {
      trackViewContent(prod);
    }
  },

  navigateToCombo: () => {
    get().navigateTo('combo');
  },

  // Slider actions
  setHeroSlide: (index) => set({ currentSlide: index }),
  nextHeroSlide: () => set((state) => {
    const len = state.productKeys.length || 1;
    return { currentSlide: (state.currentSlide + 1) % len };
  }),
  prevHeroSlide: () => set((state) => {
    const len = state.productKeys.length || 1;
    return { currentSlide: (state.currentSlide - 1 + len) % len };
  }),

  // Toast
  showToast: (message) => {
    if (window._skToastTimer) {
      clearTimeout(window._skToastTimer);
    }
    set({ toast: { show: true, message } });
    window._skToastTimer = setTimeout(() => {
      set({ toast: { show: false, message: '' } });
      window._skToastTimer = null;
    }, 2500);
  },

  // Cart actions
  addToCart: (slug, quantity = 1, showToastNotification = true) => {
    const { products } = get();
    const prod = products[slug];
    if (!prod) return;

    const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);
    if (isOutOfStock) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, "${prod.name_bn || prod.name}" বর্তমানে আউট অব স্টক রয়েছে!` : `Sorry, "${prod.name}" is currently out of stock!`);
      return;
    }

    set((state) => ({
      cart: {
        ...state.cart,
        [slug]: (state.cart[slug] || 0) + quantity,
      }
    }));
    trackAddToCart(prod, quantity);
    if (showToastNotification) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `${prod.name_bn || prod.name} কার্টে যোগ করা হয়েছে` : `Added ${prod.name} to cart`);
    }
  },

  addComboToCart: () => {
    const { products } = get();
    const comboKey = 'variety-condoms-30pcs-combo';
    const comboProd = products[comboKey] || products['combo-26'] || { id: comboKey, name: 'MO Ultimate 3-in-1 Latex Contraceptive (30 Pcs Combo)', price: 900, regularPrice: 1200 };

    const isOutOfStock = Boolean(comboProd.isOutOfStock || comboProd.stockStatus === 'outofstock' || comboProd.stockStatus === 'out_of_stock' || comboProd.stockAmount === 0);
    if (isOutOfStock) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, কম্বো প্যাকটি বর্তমানে আউট অব স্টক!` : `Sorry, the Combo Pack is currently out of stock!`);
      return;
    }

    set((state) => ({
      cart: {
        ...state.cart,
        [comboKey]: (state.cart[comboKey] || 0) + 1,
      }
    }));
    trackAddToCart(comboProd, 1);
    const isBn = get().language === 'bn';
    get().showToast(isBn ? `কম্বো প্যাক সফলভাবে কার্টে যোগ করা হয়েছে!` : `Combo Pack successfully added to cart!`);
    get().openCartDrawer();
  },

  buyNowDirect: (slug) => {
    const { products } = get();
    const prod = products[slug];
    if (prod && (prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0)) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, এই পণ্যটি বর্তমানে আউট অব স্টক!` : `Sorry, this product is currently out of stock!`);
      return;
    }
    get().addToCart(slug, 1, false);
    get().navigateTo('checkout');
  },

  setProductQty: (slug, qty) => {
    set((state) => {
      const newCart = { ...state.cart };
      if (qty <= 0) {
        delete newCart[slug];
      } else {
        newCart[slug] = qty;
      }
      return { cart: newCart };
    });
  },

  // Dynamic Totals & Delivery computation
  getCartTotals: () => {
    const { cart, products, shippingInfo, shippingAddress, sameAsBilling, appliedCoupon } = get();

    let subtotal = 0;
    let totalItemCount = 0;

    Object.entries(cart).forEach(([slug, qty]) => {
      if (qty <= 0) return;
      totalItemCount += qty;
      const prod = products[slug];
      const itemPrice = prod ? prod.price : (slug.includes('combo') ? 900 : 400);
      subtotal += itemPrice * qty;
    });

    // Dynamic Delivery Fee calculation based on active district & thana
    let deliveryFee = 0;
    if (totalItemCount > 0) {
      const activeDistrict = (sameAsBilling ? (shippingInfo.district || '') : (shippingAddress.district || '')).trim().toLowerCase();
      const activeThana = (sameAsBilling ? (shippingInfo.thana || '') : (shippingAddress.thana || '')).trim().toLowerCase();

      if (activeDistrict === 'dhaka') {
        const suburbThanas = ['savar', 'ashulia', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar'];
        if (suburbThanas.includes(activeThana)) {
          deliveryFee = 90; // Dhaka Suburbs
        } else {
          deliveryFee = 70; // Inside Dhaka City
        }
      } else if (activeDistrict === 'gazipur' || activeDistrict === 'narayanganj') {
        deliveryFee = 90; // Dhaka Suburbs
      } else if (activeDistrict) {
        deliveryFee = 120; // Outside Dhaka
      } else {
        deliveryFee = 70; // Default when unselected
      }
    }

    // Dynamic Coupon Discount Calculation & Automatic FREEOCT application (1,000+ Tk orders)
    let discountAmount = 0;
    let isFreeShippingCoupon = false;
    let originalDeliveryFee = deliveryFee;

    let effectiveCoupon = appliedCoupon;

    if (subtotal >= 1000) {
      if (!appliedCoupon || appliedCoupon.code === 'FREEOCT' || appliedCoupon.isAutoApplied) {
        effectiveCoupon = {
          code: 'FREEOCT',
          discountType: 'free_shipping',
          discountValue: 0,
          minOrderAmount: 1000,
          active: true,
          isAutoApplied: true,
          description: 'Free Shipping on orders ৳1,000+'
        };
      }
    } else if (appliedCoupon && (appliedCoupon.isAutoApplied || appliedCoupon.code === 'FREEOCT')) {
      effectiveCoupon = null;
    }

    if (effectiveCoupon && subtotal > 0) {
      const minOrder = Number(effectiveCoupon.minOrderAmount || 0);
      if (subtotal >= minOrder) {
        if (effectiveCoupon.discountType === 'free_shipping') {
          isFreeShippingCoupon = true;
          deliveryFee = 0;
          discountAmount = 0;
        } else if (effectiveCoupon.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * Number(effectiveCoupon.discountValue || 0)) / 100);
          discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
        } else {
          discountAmount = Number(effectiveCoupon.discountValue || 0);
          discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
        }
      }
    }

    const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

    return {
      subtotal,
      deliveryFee,
      originalDeliveryFee,
      isFreeShippingCoupon,
      discountAmount,
      grandTotal,
      itemCount: totalItemCount,
      appliedCoupon: effectiveCoupon
    };
  },

  // Order submission with exact Decantre-compatible Payload & live backend API dispatch
  submitOrder: async (customPayload = null) => {
    const totals = get().getCartTotals();
    const appliedCoupon = totals.appliedCoupon || get().appliedCoupon;
    const cart = get().cart;
    const shippingInfo = get().shippingInfo;
    const shippingAddress = get().shippingAddress;
    const sameAsBilling = get().sameAsBilling;
    const orderNotes = get().orderNotes;
    const products = get().products;
    const nowIso = new Date().toISOString();

    const orderPayload = customPayload || {
      billingInfo: {
        fullName: (shippingInfo.fullName || '').trim(),
        phone: (shippingInfo.phone || '').trim(),
        email: (shippingInfo.email || '').trim(),
        address: (shippingInfo.address || '').trim(),
        city: (shippingInfo.city || shippingInfo.district || 'Dhaka').trim(),
        thana: (shippingInfo.thana || '').trim(),
        district: (shippingInfo.district || 'Dhaka').trim(),
        state: (shippingInfo.division || shippingInfo.district || 'Dhaka').trim(),
        division: (shippingInfo.division || shippingInfo.district || 'Dhaka').trim(),
        zip: (shippingInfo.zip || '').trim()
      },
      shippingInfo: !sameAsBilling ? {
        fullName: (shippingAddress.fullName || '').trim(),
        phone: (shippingAddress.phone || '').trim(),
        address: (shippingAddress.address || '').trim(),
        city: (shippingAddress.city || shippingAddress.district || 'Dhaka').trim(),
        thana: (shippingAddress.thana || '').trim(),
        district: (shippingAddress.district || 'Dhaka').trim(),
        state: (shippingAddress.division || shippingAddress.district || 'Dhaka').trim(),
        division: (shippingAddress.division || shippingAddress.district || 'Dhaka').trim(),
        zip: (shippingAddress.zip || '').trim()
      } : null,
      shipToDifferentAddress: !sameAsBilling,
      fbp: getFbp() || undefined,
      fbc: getFbc() || undefined,
      externalId: getExternalId() || undefined,
      siteKey: SITE_CONFIG.siteKey,
      clientDomain: SITE_CONFIG.domain,
      orderPrefix: SITE_CONFIG.siteKey === 'shop' ? 'SSH' : 'SST',
      giftWrap: false,
      orderNotes: (orderNotes || '').trim(),
      paymentMethod: 'cod',
      subtotal: totals.subtotal,
      shippingFee: totals.deliveryFee,
      shippingTotalAmount: totals.deliveryFee,
      tax: 0,
      discountTotalAmount: totals.discountAmount || 0,
      couponCode: appliedCoupon ? String(appliedCoupon.code).trim().toUpperCase() : null,
      total: totals.grandTotal,
      items: Object.entries(cart)
        .filter(([_, qty]) => qty > 0)
        .map(([slug, qty]) => {
          const prod = products[slug];
          return {
            productId: prod?.mongoId || prod?._id || prod?.id || undefined,
            productDid: prod?.did || slug,
            name: prod?.name || slug,
            quantity: qty,
            unitPrice: prod?.price || 400,
            size: 'Standard Pack'
          };
        }),
      paymentDetails: null,
      timestamp: nowIso,
      createdAt: nowIso
    };

    const endpoints = [
      `${API_BASE_URL}/api/v1/orders/new-order`,
      `${API_BASE_URL}/api/orders/new-order`,
      '/api/v1/orders/new-order',
      '/api/orders/new-order'
    ];

    let responseData = null;
    let lastError = null;

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(orderPayload)
        });

        const json = await res.json().catch(() => null);

        if (res.ok) {
          responseData = json;
          break;
        } else {
          const errMsg = json?.errors?.join(', ') || json?.message || `Server returned error ${res.status}`;
          lastError = new Error(errMsg);
          if (res.status === 400) {
            throw lastError;
          }
        }
      } catch (err) {
        lastError = err;
        if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          throw err;
        }
      }
    }

    if (!responseData) {
      throw lastError || new Error('Failed to reach order server. Please check your connection.');
    }

    const resolvedOrderNumber = responseData?.data?.orderNumber || responseData?.data?.id || responseData?.orderNumber || ('SS-' + Math.floor(100000 + Math.random() * 900000));

    const newOrder = {
      orderId: resolvedOrderNumber,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: nowIso,
      customer: {
        name: orderPayload.billingInfo.fullName,
        mobile: orderPayload.billingInfo.phone,
        email: orderPayload.billingInfo.email,
        address: orderPayload.billingInfo.address,
        district: orderPayload.billingInfo.district,
        thana: orderPayload.billingInfo.thana
      },
      shippingRecipient: orderPayload.shippingInfo ? {
        name: orderPayload.shippingInfo.fullName,
        mobile: orderPayload.shippingInfo.phone,
        address: orderPayload.shippingInfo.address,
        district: orderPayload.shippingInfo.district,
        thana: orderPayload.shippingInfo.thana
      } : null,
      shipToDifferentAddress: orderPayload.shipToDifferentAddress,
      orderNotes: orderPayload.orderNotes,
      payload: orderPayload,
      items: { ...get().cart },
      totals,
      serverData: responseData?.data || null
    };

    trackPurchase(newOrder, get().products);

    set({
      lastOrder: newOrder,
      cart: {},
      appliedCoupon: null,
      couponCodeInput: '',
      couponError: ''
    });

    get().navigateTo('confirmation');
    return { success: true, orderNumber: resolvedOrderNumber, data: responseData?.data };
  }
}));
