import { useStore } from '../store/useStore';
import { bn as bnBase } from './bn';
import { en as enBase } from './en';
import { translations as extraTranslations } from './translations';

// Deep merge dictionaries
const deepMerge = (target, source) => {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
};

const combinedBn = deepMerge(bnBase || {}, extraTranslations?.bn || {});
const combinedEn = deepMerge(enBase || {}, extraTranslations?.en || {});

const allTranslations = {
  bn: combinedBn,
  en: combinedEn,
};

// Comprehensive Key Aliases mapping common camelCase/flat keys to structured dictionary paths
const KEY_ALIASES = {
  // Common
  'addToCart': 'common.add_to_cart',
  'add_to_cart': 'common.add_to_cart',
  'buyNow': 'common.buy_now',
  'buy_now': 'common.buy_now',
  'viewDetails': 'common.view_details',
  'view_details': 'common.view_details',
  'details': 'common.view_details',
  'quantity': 'common.quantity',
  'price': 'common.price',
  'inStock': 'common.in_stock',
  'brand': 'common.brand',
  'verified': 'common.verified',
  'remove': 'common.remove',
  'save': 'common.save',
  'off': 'common.off',
  'regular': 'common.regular',
  'total': 'common.total',

  // Home View
  'featuredCollection': 'home.featured_badge',
  'theMoLineup': 'home.lineup_title',
  'theMoLineupSubtitle': 'home.lineup_desc',
  'comboExclusiveBadge': 'home.combo_badge',
  'comboHeadline': 'home.combo_title',
  'comboRegularPrice': 'navbar.marquee_regular',
  'comboSavingsTag': 'home.combo_save',
  'comboActionButton': 'home.combo_btn',
  'comboDiscreetNote': 'home.combo_subtext',
  'serviceStandardsBadge': 'home.standards_badge',
  'serviceStandardsTitle': 'home.standards_title',
  'serviceStandardsSubtitle': 'home.standards_desc',
  'benefit1Title': 'home.authentic_title',
  'benefit1Desc': 'home.authentic_desc',
  'benefit2Title': 'home.discreet_title',
  'benefit2Desc': 'home.discreet_desc',
  'benefit3Title': 'home.online_title',
  'benefit3Desc': 'home.online_desc',
  'benefit4Title': 'home.options_title',
  'benefit4Desc': 'home.options_desc',
  'benefit5Title': 'home.checkout_title',
  'benefit5Desc': 'home.checkout_desc',
  'benefit6Title': 'home.cod_title',
  'benefit6Desc': 'home.cod_desc',
  'productSpotlightBadge': 'home.spotlight_badge',
  'individualFocusTitle': 'home.spotlight_title',
  'individualFocusSubtitle': 'home.spotlight_desc',
  'keyCharacteristics': 'home.characteristics_title',

  // Product Detail
  'home': 'product_detail.breadcrumb_home',
  'products': 'product_detail.breadcrumb_products',
  'factorySealedBadge': 'product_detail.sealed_import',
  'unitPrice': 'product_detail.unit_price_bdt',
  'cashOnDelivery': 'product_detail.cod_badge',
  'productDescriptionHeading': 'product_detail.description_title',
  'keySpecificationsHeading': 'product_detail.specs_title',
  'discreetAssuranceLabel': 'product_detail.discreet_title',
  'discreetAssuranceText': 'product_detail.discreet_text',
  'addComplementaryHeading': 'product_detail.complementary_title',
  'addComplementarySubtitle': 'product_detail.complementary_desc',
  'orGetComboAction': 'product_detail.or_get_combo',
};

// Fallback dictionary for English phrases to Bengali when bn is active
const EN_TO_BN_PHRASES = {
  'Add to Cart': 'কার্টে যোগ করুন',
  'Buy Now': 'এখনই কিনুন',
  'View details': 'বিস্তারিত দেখুন',
  'View Details': 'বিস্তারিত দেখুন',
  'Details': 'বিস্তারিত',
  'Quantity:': 'পরিমাণ:',
  'Quantity': 'পরিমাণ',
  'Price': 'মূল্য',
  'PRICE': 'মূল্য',
  'In Stock': 'স্টকে আছে',
  'Home': 'হোম',
  'Products': 'প্রোডাক্টস',
  'Brand': 'ব্র্যান্ড',
  'Cash on Delivery': 'ক্যাশ অন ডেলিভারি',
  'Featured Collection': 'বিশেষ কালেকশন',
  'The MO Lineup': 'MO প্রোডাক্ট লাইনআপ',
  'Authentic premium variants crafted for discreet personal care.': 'গোপনীয় ও প্রিমিয়াম পার্সোনাল কেয়ারের জন্য বিশ্বস্ত ভ্যারিয়েন্ট।',
  'Factory sealed standard import': 'ফ্যাক্টরি সিল করা আসল ইমপোর্ট',
  'Unit Price (BDT)': 'ইউনিট মূল্য (টাকা)',
  'Product Description': 'পণ্যের বিবরণ',
  'Key Specifications': 'স্পেসিফিকেশন ও বৈশিষ্ট্য',
  'Discreet Assurance:': 'গোপনীয়তার নিশ্চয়তা:',
  'Shipped in completely unmarked, unprinted parcel bags. Zero personal wellness labels on outer packaging.': 'আমাদের প্রতিটি পার্সেল সম্পূর্ণ গোপনীয় ও সাধারণ কার্টনে মোড়ানো থাকে। ডেলিভারি প্যাকেজের উপর ভেতরের পণ্যের কোনো নাম বা বিবরণ থাকে না।',
  'Add Complementary Products': 'অন্যান্য ভ্যারিয়েন্ট দেখুন',
  'Combine multiple products together in one discreet shipment.': 'আমাদের প্রিমিয়াম কালেকশনের অন্যান্য পণ্য এক্সপ্লোর করুন।',
  'Or get Combo Pack →': 'অথবা ৩টি প্যাকের সম্পূর্ণ কম্বো নিন →',
  'Or get Combo Pack (৳800) →': 'অথবা ৩টি প্যাকের সম্পূর্ণ কম্বো নিন →',
  'Surokkha Service Standards': 'সুরক্ষা সেবা মান',
  'Why Shop with Surokkha.shop?': 'কেন Surokkha.shop থেকে কিনবেন?',
  'Reliable, discreet wellness shopping across Bangladesh with zero hassle.': 'সারা বাংলাদেশে নির্ভরযোগ্য ও সম্পূর্ণ গোপনীয় কেনাকাটা।',
  'Authentic Products': '১০০% আসল প্রোডাক্ট',
  'Discreet Delivery': '১০০% গোপনীয় ডেলিভারি',
  'Convenient Online Ordering': 'সহজ অনলাইন অর্ডার',
  'Multiple Product Options': 'ভ্যারাইটি অপশন',
  'Easy Checkout': 'সহজ চেকআউট পদ্ধতি',
  'Product Spotlight': 'প্রোডাক্ট স্পটলাইট',
  'Individual Focus on MO': 'MO ভ্যারিয়েন্টের বিশেষত্ব',
  'Detailed look at each texture tailored for discreet satisfaction.': 'সর্বোচ্চ তৃপ্তি ও সুরক্ষার জন্য প্রতিটি টেক্সচারের বিশদ বিবরণ।',
  'Key Characteristics': 'প্রধান বৈশিষ্ট্যসমূহ',
  'Customer Reviews & Feedback': 'গ্রাহক প্রতিক্রিয়া ও অভিজ্ঞতা',
  'What Our Customers Say': 'আমাদের সম্মানিত গ্রাহকদের মতামত',
  'Real experiences and discreet wellness feedback from verified buyers across Bangladesh.': 'সারা বাংলাদেশ থেকে সংগৃহীত প্রকৃত ক্রেতাদের বিশ্বস্ত ও গোপনীয় অভিজ্ঞতার গল্প।',
  'Verified Buyer': 'ভেরিফায়েড ক্রেতা',
  'Previous Reviews': 'পূর্ববর্তী রিভিউ',
  'Next Reviews': 'পরবর্তী রিভিউ',
};

export function useTranslation() {
  const language = useStore((state) => state.language) || 'bn';
  const setLanguageInStore = useStore((state) => state.setLanguage) || (() => {});

  const isBn = language === 'bn';
  const isEn = language === 'en';

  /**
   * Flexible translation helper supporting:
   * t('key')
   * t('key', 'Fallback Text')
   * t('key', { param: 123 })
   * t('key', 'Fallback Text', { param: 123 })
   * t('key', { param: 123 }, 'Fallback Text')
   */
  const t = (key, param1 = null, param2 = null) => {
    if (!key) return '';

    let params = {};
    let fallback = null;

    if (typeof param1 === 'string') {
      fallback = param1;
      params = (typeof param2 === 'object' && param2 !== null) ? param2 : {};
    } else if (typeof param1 === 'object' && param1 !== null) {
      params = param1;
      fallback = typeof param2 === 'string' ? param2 : null;
    }

    const langDict = allTranslations[language] || allTranslations.bn || allTranslations.en;
    const fallbackDict = isBn ? (allTranslations.en || {}) : (allTranslations.bn || {});

    const resolveKey = (dict, path) => {
      if (!dict || !path) return undefined;
      if (dict[path] !== undefined) return dict[path];
      const parts = path.split('.');
      let current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return undefined;
        }
      }
      return current;
    };

    // 1. Direct or dotted lookup in current language dict
    let val = resolveKey(langDict, key);

    // 2. Lookup via KEY_ALIASES in current language dict
    if (val === undefined && KEY_ALIASES[key]) {
      val = resolveKey(langDict, KEY_ALIASES[key]);
    }

    // 3. If in Bengali mode, check EN_TO_BN_PHRASES for fallback or key
    if (isBn && (val === undefined || typeof val === 'object')) {
      if (fallback && EN_TO_BN_PHRASES[fallback]) {
        val = EN_TO_BN_PHRASES[fallback];
      } else if (EN_TO_BN_PHRASES[key]) {
        val = EN_TO_BN_PHRASES[key];
      }
    }

    // 4. Fallback lookup in secondary language dictionary
    if (val === undefined) {
      val = resolveKey(fallbackDict, key);
      if (val === undefined && KEY_ALIASES[key]) {
        val = resolveKey(fallbackDict, KEY_ALIASES[key]);
      }
    }

    // 5. If val is an object (e.g. parent section), never return it directly to JSX
    if (typeof val === 'object' && val !== null) {
      val = undefined;
    }

    // 6. Use fallback or formatted key if still undefined
    if (val === undefined) {
      if (isBn && fallback && EN_TO_BN_PHRASES[fallback]) {
        val = EN_TO_BN_PHRASES[fallback];
      } else if (typeof fallback === 'string') {
        val = fallback;
      } else {
        val = key;
      }
    }

    // 7. Param interpolation e.g. {name}, {n}, {total}
    if (typeof val === 'string' && params && typeof params === 'object') {
      return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
        return str.replaceAll(`{${paramKey}}`, String(paramVal));
      }, val);
    }

    return val;
  };

  const setLanguage = (lang) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('surokkha_lang', lang);
      } catch (e) {}
    }
    setLanguageInStore(lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  // Localized product data extractors (handles data_bn, name_bn, data_en, etc.)
  const getLocalizedName = (product) => {
    if (!product) return '';
    if (isBn) {
      if (product.data_bn && (product.data_bn.name || product.data_bn.title)) {
        return product.data_bn.name || product.data_bn.title;
      }
      if (product.name_bn || product.title_bn) {
        return product.name_bn || product.title_bn;
      }
      if (product.bn && (product.bn.name || product.bn.title)) {
        return product.bn.name || product.bn.title;
      }
    } else {
      if (product.data_en && (product.data_en.name || product.data_en.title)) {
        return product.data_en.name || product.data_en.title;
      }
      if (product.en && (product.en.name || product.en.title)) {
        return product.en.name || product.en.title;
      }
    }
    return product.name || product.title || '';
  };

  const getLocalizedTagline = (product) => {
    if (!product) return '';
    if (isBn) {
      if (product.data_bn && (product.data_bn.tagline || product.data_bn.shortDescription || product.data_bn.subtitle)) {
        return product.data_bn.tagline || product.data_bn.shortDescription || product.data_bn.subtitle;
      }
      if (product.tagline_bn || product.shortDescription_bn || product.subtitle_bn) {
        return product.tagline_bn || product.shortDescription_bn || product.subtitle_bn;
      }
      if (product.bn && (product.bn.tagline || product.bn.shortDescription)) {
        return product.bn.tagline || product.bn.shortDescription;
      }
    } else {
      if (product.data_en && (product.data_en.tagline || product.data_en.shortDescription)) {
        return product.data_en.tagline || product.data_en.shortDescription;
      }
      if (product.en && (product.en.tagline || product.en.shortDescription)) {
        return product.en.tagline || product.en.shortDescription;
      }
    }
    return product.tagline || product.shortDescription || product.subtitle || '';
  };

  const getLocalizedShortDescription = (product) => {
    if (!product) return '';
    if (isBn) {
      if (product.data_bn && (product.data_bn.description || product.data_bn.shortDescription)) {
        return product.data_bn.description || product.data_bn.shortDescription;
      }
      if (product.shortDescription_bn) {
        return product.shortDescription_bn;
      }
      if (product.description_bn) {
        return product.description_bn;
      }
      if (product.bn && (product.bn.description || product.bn.shortDescription)) {
        return product.bn.description || product.bn.shortDescription;
      }
    } else {
      if (product.data_en && (product.data_en.description || product.data_en.shortDescription)) {
        return product.data_en.description || product.data_en.shortDescription;
      }
      if (product.en && (product.en.description || product.en.shortDescription)) {
        return product.en.description || product.en.shortDescription;
      }
      if (product.shortDescription) {
        return product.shortDescription;
      }
    }
    return product.description || product.shortDescription || '';
  };

  const getLocalizedLongDescription = (product) => {
    if (!product) return '';
    if (isBn) {
      if (product.data_bn && product.data_bn.longDescription) {
        return product.data_bn.longDescription;
      }
      if (product.longDescription_bn) {
        return product.longDescription_bn;
      }
      if (product.bn && product.bn.longDescription) {
        return product.bn.longDescription;
      }
      return getLocalizedShortDescription(product);
    } else {
      if (product.data_en && product.data_en.longDescription) {
        return product.data_en.longDescription;
      }
      if (product.en && product.en.longDescription) {
        return product.en.longDescription;
      }
      if (product.longDescription) {
        return product.longDescription;
      }
      return getLocalizedShortDescription(product);
    }
  };

  const getLocalizedDescription = (product) => {
    return getLocalizedLongDescription(product) || getLocalizedShortDescription(product);
  };
  const getLocalizedFeatures = (product) => {
    if (!product) return [];
    if (isBn) {
      if (product.data_bn && Array.isArray(product.data_bn.features) && product.data_bn.features.length > 0) {
        return product.data_bn.features;
      }
      if (Array.isArray(product.features_bn) && product.features_bn.length > 0) {
        return product.features_bn;
      }
      if (product.bn && Array.isArray(product.bn.features) && product.bn.features.length > 0) {
        return product.bn.features;
      }
      if (product.bulletPoints_bn && Array.isArray(product.bulletPoints_bn)) {
        return product.bulletPoints_bn;
      }
    } else {
      if (product.data_en && Array.isArray(product.data_en.features) && product.data_en.features.length > 0) {
        return product.data_en.features;
      }
      if (product.en && Array.isArray(product.en.features) && product.en.features.length > 0) {
        return product.en.features;
      }
    }
    return Array.isArray(product.features) ? product.features : (product.bulletPoints || []);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') return '';
    const num = Number(price);
    if (isNaN(num)) return `৳${price}`;
    if (!isBn) return `৳${num}`;
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return '৳' + String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '';
    if (!isBn) return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  return { 
    t, 
    language, 
    setLanguage, 
    toggleLanguage,
    isBn,
    isEn,
    getLocalizedName,
    getLocalizedTagline,
    getLocalizedDescription,
    getLocalizedShortDescription,
    getLocalizedLongDescription,
    getLocalizedFeatures,
    formatPrice,
    formatNumber
  };
}

export default useTranslation;
