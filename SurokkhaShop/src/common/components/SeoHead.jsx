import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const SITE = 'https://surokkha.shop';
const BRAND = 'সুরক্ষা | Surokkha Shop';
const HOME_TITLE = 'সুরক্ষা | Surokkha Shop – স্বাস্থ্য ও সুস্থতা এবং পার্সোনাল কেয়ার অনলাইন শপ';
const HOME_DESC =
  'সুরক্ষা (Surokkha Shop) – বাংলাদেশে প্রিমিয়াম স্বাস্থ্য, সুস্থতা ও পার্সোনাল কেয়ার পণ্য অনলাইনে কিনুন। ১০০% আসল পণ্য, ক্যাশ অন ডেলিভারি, সারা দেশে দ্রুত হোম ডেলিভারি।';
const DEFAULT_KEYWORDS =
  'স্বাস্থ্য ও সুস্থতা, পার্সোনাল কেয়ার, স্কিন কেয়ার, হেলথ প্রোডাক্টস, Health & Wellness, Personal Care, Wellness Essentials, Surokkha Shop';

// Title, description, path and indexability for every non-product page
const PAGES = {
  home: { path: '/', title: HOME_TITLE, desc: HOME_DESC },
  shop: { path: '/shop', title: `সব পণ্য – স্বাস্থ্য, সুস্থতা ও পার্সোনাল কেয়ার | ${BRAND}`, desc: 'সুরক্ষা শপের সব পণ্য: প্রিমিয়াম ব্র্যান্ডের স্বাস্থ্য, সুস্থতা ও পার্সোনাল কেয়ার আইটেম। ক্যাশ অন ডেলিভারি ও সারা দেশে দ্রুত হোম ডেলিভারি।' },
  combo: { path: '/offers', title: `কম্বো অফার ও বিশেষ ছাড় | ${BRAND}`, desc: 'সুরক্ষা শপের বিশেষ ওয়েলনেস কম্বো প্যাক ও আকর্ষণীয় অফার। সাশ্রয়ী মূল্যে প্রিমিয়াম পণ্য, সারা দেশে দ্রুত হোম ডেলিভারি।' },
  faq: { path: '/faq', title: `প্রশ্নোত্তর (FAQ) | ${BRAND}`, desc: 'অর্ডার, ডেলিভারি, পেমেন্ট ও কাস্টমার সার্ভিস নিয়ে সাধারণ প্রশ্নের উত্তর।' },
  contact: { path: '/contact', title: `যোগাযোগ | ${BRAND}`, desc: 'সুরক্ষা শপের সাথে ফোন বা WhatsApp-এ যোগাযোগ করুন।' },
  terms: { path: '/terms', title: `শর্তাবলি | ${BRAND}`, desc: 'সুরক্ষা শপ ব্যবহারের সাধারণ নিয়ম ও শর্তাবলি।' },
  privacy: { path: '/privacy', title: `প্রাইভেসি পলিসি | ${BRAND}`, desc: 'সুরক্ষা শপ গ্রাহকদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা ও সুরক্ষা বজায় রাখে।' },
  refund: { path: '/refund', title: `রিটার্ন ও রিফান্ড নীতি | ${BRAND}`, desc: 'সুরক্ষা শপের সহজ ও গ্রাহকবান্ধব রিটার্ন এবং রিফান্ড পলিসি।' },
  checkout: { path: '/checkout', title: `চেকআউট | ${BRAND}`, desc: HOME_DESC, noindex: true },
  confirmation: { path: '/confirmation', title: `অর্ডার কনফার্মেশন | ${BRAND}`, desc: HOME_DESC, noindex: true },
  account: { path: '/account', title: `আমার অ্যাকাউন্ট | ${BRAND}`, desc: HOME_DESC, noindex: true },
  notfound: { path: null, title: `পেজটি পাওয়া যায়নি | ${BRAND}`, desc: HOME_DESC, noindex: true },
};

// Finds or creates a meta or link tag in head and sets one attribute on it
const setTag = (selector, create, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

// Sets a meta tag by name attribute
const setMeta = (name, content) => setTag(`meta[name="${name}"]`, { tag: 'meta', attrs: { name } }, 'content', content);

// Sets a meta tag by property attribute
const setProp = (property, content) => setTag(`meta[property="${property}"]`, { tag: 'meta', attrs: { property } }, 'content', content);

// Truncates text cleanly to a maximum length
const clip = (text, max) => {
  const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
};

// Resolves absolute image URL for product metadata
const absoluteImage = (product) => {
  const first = [product.featuredImage, product.imageUrl, product.thumbnailUrl, product.images?.[0], product.gallery?.[0]]
    .map((v) => (typeof v === 'string' ? v : v?.url))
    .find(Boolean);
  if (!first) return `${SITE}/banners/trial-pack-packets.webp`;
  return /^https?:\/\//.test(first) ? first : `${SITE}${first.startsWith('/') ? '' : '/'}${first}`;
};

// Formats product structured data for schema.org
const productJsonLd = (product, url, image) => {
  const name = product.name_bn && product.name_bn !== product.name ? `${product.name} (${product.name_bn})` : product.name;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: [image],
    description: clip(product.description || name, 300),
    sku: product.sku || undefined,
    brand: product.brandName || product.brand ? { '@type': 'Brand', name: product.brandName || product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BDT',
      price: Number(product.price) || undefined,
      availability: product.isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@id': `${SITE}/#organization` },
    },
  };
};

// Synchronizes page title, meta description, canonical and Open Graph tags
const SeoHead = () => {
  const view = useStore((s) => s.currentView);
  const slug = useStore((s) => s.selectedProductSlug);
  const products = useStore((s) => s.products);

  useEffect(() => {
    let title;
    let desc;
    let path;
    let noindex = false;
    let image = `${SITE}/banners/trial-pack-packets.webp`;
    let jsonLd = null;

    if (view === 'product') {
      const product = products?.[slug] || Object.values(products || {}).find((p) => p?.slug === slug);
      path = `/product/${product?.slug || slug}`;
      if (product) {
        const nameBn = product.name_bn && product.name_bn !== product.name ? ` – ${product.name_bn}` : '';
        title = `${product.name}${nameBn} | সুরক্ষা`;
        desc = clip(`${product.name}${nameBn}। দাম ৳${product.price}। ১০০% অরিজিনাল স্বাস্থ্য ও পার্সোনাল কেয়ার পণ্য, ক্যাশ অন ডেলিভারি ও দ্রুত হোম ডেলিভারি – সুরক্ষা (Surokkha Shop)।`, 160);
        image = absoluteImage(product);
        jsonLd = productJsonLd(product, `${SITE}${path}`, image);
      } else {
        title = `${BRAND}`;
        desc = HOME_DESC;
      }
    } else {
      const page = PAGES[view] || PAGES.home;
      ({ title, desc, path } = page);
      noindex = Boolean(page.noindex);
    }

    document.title = title;
    setMeta('description', desc);
    setMeta('keywords', DEFAULT_KEYWORDS);
    setMeta('robots', noindex ? 'noindex,follow' : 'index,follow');
    setProp('og:title', title);
    setProp('og:description', desc);
    setProp('og:image', image);
    setProp('og:type', view === 'product' ? 'product' : 'website');
    if (path) {
      setTag('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical' } }, 'href', `${SITE}${path}`);
      setProp('og:url', `${SITE}${path}`);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }

    const existing = document.getElementById('seo-page-jsonld');
    if (jsonLd) {
      const script = existing || Object.assign(document.createElement('script'), { id: 'seo-page-jsonld', type: 'application/ld+json' });
      script.textContent = JSON.stringify(jsonLd);
      if (!existing) document.head.appendChild(script);
    } else {
      existing?.remove();
    }
  }, [view, slug, products]);

  return null;
};

export default SeoHead;
