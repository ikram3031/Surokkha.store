import { create } from 'zustand';
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
  getFbLoginId,
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

// Simple (non-variable) Items can only be ordered once; Products and variable Items allow multiple qty
export const isSingleQtyItem = (prod) => {
  if (!prod) return false;
  const isItem = prod.itemType === 'item' || prod.type === 'item';
  const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
  return isItem && !hasVariants;
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
  products: {},
  productKeys: [],
  hasFetchedAllProducts: false,
  isLoadingProducts: true,
  productsError: null,
  categories: [],
  isLoadingCategories: false,

  fetchCategories: async () => {
    set({ isLoadingCategories: true });
    try {
      const cleanBase = (API_BASE_URL || 'https://api.surokkha.store').replace(/\/$/, '');
      const res = await fetch(`${cleanBase}/api/v1/categories`, {
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
      set({ isLoadingCategories: false });
    } catch {
      set({ isLoadingCategories: false });
    }
  },

  // Fetch Dynamic Products and Items directly from API simultaneously
  fetchProducts: async (singleSlug = null, itemType = null) => {
    set({ isLoadingProducts: true, productsError: null });
    try {
      const cleanBase = (API_BASE_URL || 'https://api.surokkha.store').replace(/\/$/, '');
      
      let productsResult = { status: 'rejected' };
      let itemsResult = { status: 'rejected' };

      if (singleSlug) {
        if (itemType === 'item') {
          itemsResult = { status: 'fulfilled', value: await fetch(`${cleanBase}/api/v1/items/${singleSlug}`).then(res => res.ok ? res.json().then(j => [j?.data || j]) : []) };
        } else if (itemType === 'product') {
          productsResult = { status: 'fulfilled', value: await fetch(`${cleanBase}/api/v1/products/${singleSlug}`).then(res => res.ok ? res.json().then(j => [j?.data || j]) : []) };
        } else {
          // Unknown type: sequential fallback to avoid unnecessary parallel 404s
          const pRes = await fetch(`${cleanBase}/api/v1/products/${singleSlug}`);
          if (pRes.ok) {
            productsResult = { status: 'fulfilled', value: await pRes.json().then(j => [j?.data || j]) };
          } else {
            const iRes = await fetch(`${cleanBase}/api/v1/items/${singleSlug}`);
            if (iRes.ok) itemsResult = { status: 'fulfilled', value: await iRes.json().then(j => [j?.data || j]) };
          }
        }
      } else {
        // Fetch all
        set({ hasFetchedAllProducts: true });
        [productsResult, itemsResult] = await Promise.allSettled([
          fetch(`${cleanBase}/api/v1/products?limit=1000`, { headers: { 'Accept': 'application/json' } }).then(async (res) => {
            if (!res.ok) return [];
            const json = await res.json();
            const data = json?.data || json?.products || json?.result || json;
            return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
          }),
          fetch(`${cleanBase}/api/v1/items?limit=1000`, { headers: { 'Accept': 'application/json' } }).then(async (res) => {
            if (!res.ok) return [];
            const json = await res.json();
            const data = json?.data || json?.items || json?.result || json;
            return Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
          }),
        ]);
      }

      const rawProducts = (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value))
        ? productsResult.value.map((p) => ({ ...p, entityType: 'product', itemType: 'product' }))
        : [];

      const rawItems = (itemsResult.status === 'fulfilled' && Array.isArray(itemsResult.value))
        ? itemsResult.value.map((i) => ({ ...i, entityType: 'item', itemType: 'item' }))
        : [];

      const combinedRaw = [...rawProducts, ...rawItems];

      if (combinedRaw.length > 0) {
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

        // Sort: Active first -> Oldest CreatedDate first (original lineup at top, new arrivals at bottom)
        combinedRaw.sort((a, b) => {
          const aIsActive = (a.isActive !== false && a.status !== 'inactive') ? 1 : 0;
          const bIsActive = (b.isActive !== false && b.status !== 'inactive') ? 1 : 0;
          if (aIsActive !== bIsActive) {
            return bIsActive - aIsActive; // Active first
          }

          const timeA = getCreatedTimestamp(a);
          const timeB = getCreatedTimestamp(b);
          if (!timeA && timeB) return -1;
          if (timeA && !timeB) return 1;
          return timeA - timeB; // Oldest first
        });

        const resolveUrl = (img) => {
          if (img && typeof img === 'string') {
            const trimmed = img.trim();
            if (!trimmed || trimmed === '#' || trimmed === '/#' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
              return null;
            }
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
              try {
                const urlObj = new URL(trimmed);
                if ((urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') && urlObj.pathname.startsWith('/uploads')) {
                  return cleanBase ? `${cleanBase}${urlObj.pathname}${urlObj.search}` : trimmed;
                }
              } catch (_) {}
              return trimmed;
            }
            if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
              return trimmed;
            }
            const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
            return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
          }
          return null;
        };

        combinedRaw.forEach((p, index) => {
          const key = p.slug || p.id || p.did || `${p.itemType || 'entity'}-${index + 1}`;

          // Strict schema mapping for pricing (Product model schema: price and offerPrice)
          // 1. Regular base price is p.price (or p.regularPrice)
          const basePrice = (p.price != null && !isNaN(Number(p.price)) && Number(p.price) > 0)
            ? Number(p.price)
            : (p.regularPrice != null && !isNaN(Number(p.regularPrice)) && Number(p.regularPrice) > 0)
            ? Number(p.regularPrice)
            : (p.regular_price != null && !isNaN(Number(p.regular_price)) && Number(p.regular_price) > 0)
            ? Number(p.regular_price)
            : 0;

          // 2. Offer price is ONLY valid when p.offerPrice is explicitly set (and > 0)
          let offerPriceVal = null;
          if (p.offerPrice != null && !isNaN(Number(p.offerPrice)) && Number(p.offerPrice) > 0) {
            offerPriceVal = Number(p.offerPrice);
          } else if (p.offerPrice === null || p.offerPrice === 0) {
            // Explicitly set to null/none in dashboard
            offerPriceVal = null;
          }

          let resolvedRegularPrice = basePrice;
          let resolvedOfferPrice = offerPriceVal;

          // If offerPrice is set and lower than base price, it is a discounted price
          const resolvedPrice = (resolvedOfferPrice != null && resolvedOfferPrice > 0 && resolvedOfferPrice < resolvedRegularPrice)
            ? resolvedOfferPrice
            : resolvedRegularPrice;

          // High-resolution featured image resolution:
          // Un-thumb helper to always request the full-resolution asset instead of low-res thumbnail
          const toHighRes = (url) => {
            if (!url || typeof url !== 'string') return url;
            return url.replace(/\/thumb_([^/]+)$/, '/$1').replace(/\/thumb\/([^/]+)$/, '/$1');
          };

          const rawFeatured = p.featuredImage || p.featured_image || p.imageUrl || p.image_url || p.product_image;
          const rawThumb = p.thumbnailUrl || p.thumbnail_url;
          const rawGalleryCandidates = Array.isArray(p.gallery_images) ? p.gallery_images : [];

          // Pick the best high-res primary image: featured/imageUrl first, then gallery first item, fallback to un-thumbed thumbnailUrl
          const rawPrimary = rawFeatured || (rawGalleryCandidates.length > 0 ? rawGalleryCandidates[0] : null) || rawThumb || null;
          const highResPrimary = rawPrimary ? toHighRes(rawPrimary) : null;
          const primaryImg = resolveUrl(highResPrimary);

          const resolvedGallery = rawGalleryCandidates.map(toHighRes).map(resolveUrl).filter(Boolean);

          // English text content as primary source of truth
          const englishName = p.name || p.title || 'Wellness Product';
          const englishTagline = p.tagline || p.shortDescription || p.subtitle || '';
          const englishDescription = p.description || p.longDescription || '';

          // Bengali fallback mappings if available
          const itemBn = (p.bn && typeof p.bn === 'object') ? p.bn : {};
          const nameBn = itemBn.name || itemBn.title || p.name_bn || p.title_bn || englishName;
          const taglineBn = itemBn.tagline || itemBn.shortDescription || itemBn.subtitle || p.tagline_bn || p.shortDescription_bn || englishTagline;
          const descriptionBn = itemBn.description || itemBn.longDescription || p.description_bn || p.longDescription_bn || englishDescription;

          // Normalize benefits
          const rawBenefits = Array.isArray(p.benefits) && p.benefits.length > 0 ? p.benefits : [];
          const rawBenefitsBn = Array.isArray(itemBn.benefits) && itemBn.benefits.length > 0 ? itemBn.benefits : rawBenefits;

          const benefits = rawBenefits.map((b) => {
            if (typeof b === 'object' && b !== null) {
              return {
                title: b.title || b.name || '',
                description: b.description || b.desc || '',
                desc: b.desc || b.description || '',
                icon: b.icon || ''
              };
            }
            return { title: String(b), description: '', desc: '', icon: '' };
          });

          const benefitsBn = rawBenefitsBn.map((b) => {
            if (typeof b === 'object' && b !== null) {
              return {
                title: b.title || b.name || '',
                description: b.description || b.desc || '',
                desc: b.desc || b.description || '',
                icon: b.icon || ''
              };
            }
            return { title: String(b), description: '', desc: '', icon: '' };
          });

          // Normalize features
          const features = benefits.length > 0 ? benefits.map((b) => b.title).filter(Boolean) : (Array.isArray(p.features) ? p.features : []);

          const featuresBn = benefitsBn.length > 0 ? benefitsBn.map((b) => b.title).filter(Boolean) : (Array.isArray(itemBn.features) && itemBn.features.length > 0 ? itemBn.features : (Array.isArray(p.features_bn) && p.features_bn.length > 0 ? p.features_bn : features));

          // Normalize specifications: Convert array form [{key, value}] to object if needed
          let specs = {};
          const rawSpecs = (p.specifications && typeof p.specifications === 'object') ? p.specifications : (p.technicalSpecs || {});
          if (Array.isArray(rawSpecs)) {
            rawSpecs.forEach((entry) => {
              if (entry && typeof entry === 'object') {
                const k = entry.key || entry.label || entry.name;
                const v = entry.value || entry.val || entry.content;
                if (k && v != null) specs[k] = v;
              }
            });
          } else if (rawSpecs && typeof rawSpecs === 'object') {
            specs = rawSpecs;
          }

          let specsBn = specs;
          if (itemBn.specifications && typeof itemBn.specifications === 'object') {
            if (Array.isArray(itemBn.specifications)) {
              specsBn = {};
              itemBn.specifications.forEach((entry) => {
                if (entry && typeof entry === 'object') {
                  const k = entry.key || entry.label || entry.name;
                  const v = entry.value || entry.val || entry.content;
                  if (k && v != null) specsBn[k] = v;
                }
              });
            } else {
              specsBn = itemBn.specifications;
            }
          }

          // Category classification
          const rawCatName = (p.category && typeof p.category === 'object' ? (p.category.name || '') : (typeof p.category === 'string' ? p.category : '')) || '';
          const rawCatSlug = (p.category && typeof p.category === 'object' ? (p.category.slug || '') : (p.categorySlug || (rawCatName ? String(rawCatName).toLowerCase().replace(/\s+/g, '-') : ''))) || '';
          const rawCatBn = (p.category && typeof p.category === 'object' && p.category.name_bn) ? p.category.name_bn : (p.category_bn || '');

          const catNameLower = rawCatName.toLowerCase();
          const catSlugLower = rawCatSlug.toLowerCase();
          const keyLower = key.toLowerCase();

          let resolvedCategory = rawCatName || "Uncategorized";
          let resolvedCategorySlug = rawCatSlug || "uncategorized";
          let resolvedCategoryBn = rawCatBn || resolvedCategory;

          const rawBrand = Array.isArray(p.brand) ? (p.brand[0] || 'MO') : (typeof p.brand === 'string' ? p.brand : 'MO');

          const productObj = {
            id: key,
            slug: key,
            did: p.did || key,
            _id: p._id || p.id,
            mongoId: p._id || p.id,
            sku: p.sku || '',
            itemType: p.itemType || 'product',
            entityType: p.entityType || 'product',
            type: p.type || 'product',
            variants: p.variants || null,
            name: englishName,
            name_bn: nameBn,
            bn: itemBn,
            brand: rawBrand,
            origin: p.origin || 'Imported (CE Certified)',
            category: resolvedCategory,
            categorySlug: resolvedCategorySlug,
            category_bn: resolvedCategoryBn,
            categories: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : [{ name: resolvedCategory, slug: resolvedCategorySlug, name_bn: resolvedCategoryBn }],
            price: resolvedPrice,
            regularPrice: resolvedRegularPrice,
            offerPrice: resolvedOfferPrice,
            salePrice: resolvedPrice < resolvedRegularPrice ? resolvedPrice : null,
            stockStatus: (p.stockStatus === 'instock' || p.stockStatus === 'in_stock')
              ? 'instock'
              : (p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.isOutOfStock === true || p.availability === 'out of stock' || (p.stockAmount === 0 && p.stock === 0 && p.stockStatus !== 'instock'))
                ? 'outofstock'
                : 'instock',
            isOutOfStock: Boolean(
              p.stockStatus !== 'instock' && p.stockStatus !== 'in_stock' &&
              (p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.isOutOfStock === true || p.availability === 'out of stock' || (p.stockAmount === 0 && p.stock === 0))
            ),
            stockAmount: (p.stockAmount != null && Number(p.stockAmount) > 0)
              ? Number(p.stockAmount)
              : ((p.stock != null && Number(p.stock) > 0) ? Number(p.stock) : (p.stockStatus === 'outofstock' ? 0 : 50)),
            isActive: p.isActive !== false && p.status !== 'inactive',
            createdAt: p.createdAt || p.created_at || p.createdDate || null,
            createdDate: p.createdDate || p.createdAt || p.created_at || p.updatedAt || p.updated_at || null,
            updatedAt: p.updatedAt || p.updated_at || null,
            createdTimestamp: getCreatedTimestamp(p),
            imageUrl: p.imageUrl || p.image_url || null,
            thumbnailUrl: p.thumbnailUrl || p.thumbnail_url || null,
            featuredImage: p.featuredImage || p.featured_image || null,
            images: Array.isArray(p.images) ? p.images : [],
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
            packSize: p.packSize || (key.includes('30pcs') ? '30 Pieces (3 Boxes)' : (key.includes('20pcs') ? '20 Pieces (2 Boxes)' : '10 Pieces / Box')),
            packSize_bn: itemBn.packSize || p.packSize || p.packSize_bn || "",
            packageContents: p.packageContents || '',
            packageContents_bn: itemBn.packageContents || p.packageContents || '',
            expiryDate: p.expiryDate || '',
            tagline: englishTagline || 'Premium personal wellness standard',
            tagline_bn: taglineBn || englishTagline,
            description: englishDescription || 'Premium discreet personal wellness product engineered under strict quality testing.',
            description_bn: descriptionBn || englishDescription,
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
            image_url: primaryImg,
            featuredImage: primaryImg,
            featured_image: primaryImg,
            thumbnailUrl: resolveUrl(p.thumbnailUrl || p.thumbnail_url) || primaryImg,
            thumbnail_url: resolveUrl(p.thumbnailUrl || p.thumbnail_url) || primaryImg,
            images: resolvedGallery,
            gallery: resolvedGallery,
            gallery_images: resolvedGallery,
          };

          normalized[key] = productObj;

          // Add aliases for secondary lookups
          if (p.did) normalized[p.did] = productObj;
          if (p.id && p.id !== key) normalized[p.id] = productObj;
          if (p._id && p._id !== key) normalized[p._id] = productObj;

          // List all active catalog products/items on website
          if (productObj.isActive !== false) {
            keys.push(key);
          }
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
          if (normalized[legacyKey] && !normalized[canonicalKey]) {
            normalized[canonicalKey] = normalized[legacyKey];
          }
        });

        const currentSlug = get().selectedProductSlug;
        const resolvedCurrent = (currentSlug && normalized[currentSlug] && !normalized[currentSlug].isOutOfStock)
          ? (normalized[currentSlug].slug || currentSlug)
          : null;
        const finalSelectedSlug = resolvedCurrent || keys[0] || 'mo-multi-textured-latex-contraceptive-10-pcs';

        set((state) => {
          const newProducts = singleSlug ? { ...state.products, ...normalized } : { ...normalized };
          const newKeys = singleSlug ? Array.from(new Set([...state.productKeys, ...keys])) : keys;
          return {
            products: newProducts,
            productKeys: newKeys,
            isLoadingProducts: false,
            selectedProductSlug: finalSelectedSlug
          };
        });
      } else {
        set({ isLoadingProducts: false });
      }
    } catch (err) {
      console.error('Error fetching products and items:', err);
      set({ isLoadingProducts: false, productsError: err.message });
    }
  },

  // Navigation with true Browser URL History Sync
  navigateToCombo: () => get().navigateTo('product', 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'),
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
    get().navigateTo('product', 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo');
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
  addToCart: (slug, quantity = 1, showToastNotification = true, variant = null) => {
    const { products } = get();
    const prod = products[slug];
    if (!prod) return;

    const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);
    if (isOutOfStock) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, "${prod.name_bn || prod.name}" বর্তমানে আউট অব স্টক রয়েছে!` : `Sorry, "${prod.name}" is currently out of stock!`);
      return;
    }

    const cartKey = variant ? `${slug}:::${variant.size}` : slug;

    if (isSingleQtyItem(prod)) {
      if (get().cart[cartKey] > 0) {
        const isBn = get().language === 'bn';
        get().showToast(isBn ? `"${prod.name_bn || prod.name}" ইতিমধ্যে কার্টে আছে` : `"${prod.name}" is already in cart`);
        return;
      }
      quantity = 1;
    }

    set((state) => ({
      cart: {
        ...state.cart,
        [cartKey]: (state.cart[cartKey] || 0) + quantity,
      }
    }));
    trackAddToCart(prod, quantity);
    if (showToastNotification) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `${prod.name_bn || prod.name} কার্টে যোগ করা হয়েছে` : `Added ${prod.name} to cart`);
    }
  },

  addMultipleToCart: (slug, variantsData, showToastNotification = true) => {
    const { products } = get();
    const prod = products[slug];
    if (!prod) return;

    const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);
    if (isOutOfStock) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, "${prod.name_bn || prod.name}" বর্তমানে আউট অব স্টক রয়েছে!` : `Sorry, "${prod.name}" is currently out of stock!`);
      return;
    }

    let totalQuantity = 0;
    const cartUpdates = {};
    
    variantsData.forEach(({ variant, quantity }) => {
      const cartKey = variant ? `${slug}:::${variant.size}` : slug;
      cartUpdates[cartKey] = quantity;
      totalQuantity += quantity;
    });

    if (totalQuantity === 0) return;

    set((state) => {
      const newCart = { ...state.cart };
      Object.entries(cartUpdates).forEach(([k, q]) => {
        newCart[k] = (newCart[k] || 0) + q;
      });
      return { cart: newCart };
    });

    trackAddToCart(prod, totalQuantity);
    
    if (showToastNotification) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `${prod.name_bn || prod.name} কার্টে যোগ করা হয়েছে` : `Added ${prod.name} to cart`);
    }
  },

  addComboToCart: (preferredKey = null) => {
    const { products, productKeys } = get();
    // Resolve dynamic combo product
    let targetComboKey = preferredKey;
    if (!targetComboKey || !products[targetComboKey]) {
      const activeCombo = Object.values(products).find(p => {
        if (!p || p.isActive === false) return false;
        const isOut = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
        if (isOut) return false;
        const isCombo = p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
        return isCombo;
      });
      targetComboKey = activeCombo?.slug || activeCombo?.id || preferredKey || 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
    }

    const comboProd = products[targetComboKey] || products['mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'] || products['variety-condoms-30pcs-combo'] || products['combo-26'];
    if (!comboProd) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, কোনো কম্বো প্যাক পাওয়া যায়নি!` : `Sorry, no combo pack found!`);
      return;
    }

    const isOutOfStock = Boolean(comboProd.isOutOfStock || comboProd.stockStatus === 'outofstock' || comboProd.stockStatus === 'out_of_stock' || comboProd.stockAmount === 0);
    if (isOutOfStock) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `দুঃখিত, কম্বো প্যাকটি বর্তমানে আউট অব স্টক!` : `Sorry, the Combo Pack is currently out of stock!`);
      return;
    }

    const resolvedKey = comboProd.slug || comboProd.id || targetComboKey;
    set((state) => ({
      cart: {
        ...state.cart,
        [resolvedKey]: (state.cart[resolvedKey] || 0) + 1,
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
    const prod = get().products[slug.split(':::')[0]];
    if (qty > 1 && isSingleQtyItem(prod)) {
      const isBn = get().language === 'bn';
      get().showToast(isBn ? `"${prod.name_bn || prod.name}" ইতিমধ্যে কার্টে আছে` : `"${prod.name}" is already in cart`);
      return;
    }
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

    Object.entries(cart).forEach(([cartKey, qty]) => {
      if (qty <= 0) return;
      totalItemCount += qty;
      const parts = cartKey.split(':::');
      const baseSlug = parts[0];
      const variantSize = parts[1];
      const prod = products[baseSlug];
      
      let itemPrice = 0;
      if (prod) {
        if (variantSize && prod.variants) {
          const variant = prod.variants.find(v => v.size === variantSize);
          if (variant) {
            itemPrice = Number(variant.offerPrice > 0 ? variant.offerPrice : (variant.price || variant.regularPrice || 0));
          }
        }
        if (!itemPrice) {
          itemPrice = Number(prod.offerPrice > 0 ? prod.offerPrice : (prod.price || prod.regularPrice || 0));
        }
      } else {
        itemPrice = cartKey.includes('combo') ? 900 : 0;
      }
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
      fb_login_id: getFbLoginId() || undefined,
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
        .map(([cartKey, qty]) => {
          const [slug, variantSize] = cartKey.split(':::');
          const prod = products[slug];
          const variant = variantSize && prod?.variants ? prod.variants.find(v => v.size === variantSize) : null;
          const rawId = prod?.mongoId || prod?._id || prod?.id || undefined;
          const itemType = prod?.itemType || (prod?.type === 'item' ? 'item' : 'product');
          return {
            productId: itemType !== 'item' ? rawId : undefined,
            itemId: itemType === 'item' ? rawId : undefined,
            itemType: itemType,
            productDid: prod?.did || slug,
            name: prod?.name || slug,
            sku: variant?.sku || prod?.sku || '',
            image: variant?.imageUrl || prod?.imageUrl || prod?.image || '',
            quantity: qty,
            unitPrice: variant?.price || prod?.price || (cartKey.includes('combo') ? 900 : 0),
            size: variant?.size || variantSize || prod?.size || 'Standard Pack'
          };
        }),
      paymentDetails: null,
      timestamp: nowIso,
      createdAt: nowIso
    };

    const cleanApiBase = (API_BASE_URL || 'https://api.surokkha.store').replace(/\/$/, '');
    const endpoint = `${cleanApiBase}/api/v1/orders/new-order`;

    let responseData = null;
    try {
      const res = await fetch(endpoint, {
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
      } else {
        const errMsg = json?.errors?.join(', ') || json?.message || `Server returned error ${res.status}`;
        throw new Error(errMsg);
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      throw new Error('Failed to reach order server. Please check your connection.');
    }

    if (!responseData) {
      throw new Error('Failed to reach order server. Please check your connection.');
    }

    const resolvedOrderNumber = String(
      responseData?.data?.orderNumber ||
      responseData?.data?.id ||
      responseData?.orderNumber ||
      ('SS-' + Math.floor(100000 + Math.random() * 900000))
    ).trim();

    const newOrder = {
      orderId: resolvedOrderNumber,
      orderNumber: resolvedOrderNumber,
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
