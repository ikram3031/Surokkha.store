import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const SITE = 'https://surokkha.shop';
const BRAND = 'সুরক্ষা | Surokkha Shop';
const HOME_TITLE = 'সুরক্ষা | Surokkha Shop – কনডম ও পার্সোনাল কেয়ার অনলাইন শপ';
const HOME_DESC =
  'সুরক্ষা (Surokkha Shop) – বাংলাদেশে অরিজিনাল কনডম, লুব্রিকেন্ট ও পার্সোনাল কেয়ার পণ্য অনলাইনে কিনুন। গোপন প্যাকেজিং, ক্যাশ অন ডেলিভারি, সারা দেশে হোম ডেলিভারি।';

// Title, description, path and indexability for every non-product page
const PAGES = {
  home: { path: '/', title: HOME_TITLE, desc: HOME_DESC },
  shop: { path: '/shop', title: `সব পণ্য – কনডম, লুব্রিকেন্ট ও কেয়ার | ${BRAND}`, desc: 'সুরক্ষা শপের সব পণ্য: Durex, MO, Xtreme কনডম, লুব্রিকেন্ট জেল ও পার্সোনাল কেয়ার। ক্যাশ অন ডেলিভারি ও গোপন প্যাকেজিং।' },
  combo: { path: '/offers', title: `কম্বো অফার ও ছাড় | ${BRAND}`, desc: 'সুরক্ষা শপের কম্বো প্যাক ও বিশেষ অফার। কম দামে বেশি পণ্য, সারা দেশে হোম ডেলিভারি।' },
  faq: { path: '/faq', title: `প্রশ্নোত্তর (FAQ) | ${BRAND}`, desc: 'অর্ডার, ডেলিভারি, পেমেন্ট ও গোপনীয়তা নিয়ে সাধারণ প্রশ্নের উত্তর।' },
  contact: { path: '/contact', title: `যোগাযোগ | ${BRAND}`, desc: 'সুরক্ষা শপের সাথে ফোন বা WhatsApp-এ যোগাযোগ করুন।' },
  terms: { path: '/terms', title: `শর্তাবলি | ${BRAND}`, desc: 'সুরক্ষা শপ ব্যবহারের শর্তাবলি।' },
  privacy: { path: '/privacy', title: `গোপনীয়তা নীতি | ${BRAND}`, desc: 'সুরক্ষা শপ আপনার তথ্য কীভাবে সংরক্ষণ ও ব্যবহার করে।' },
  refund: { path: '/refund', title: `রিটার্ন ও রিফান্ড নীতি | ${BRAND}`, desc: 'সুরক্ষা শপের রিটার্ন ও রিফান্ড নীতি।' },
  checkout: { path: '/checkout', title: `চেকআউট | ${BRAND}`, desc: HOME_DESC, noindex: true },
  confirmation: { path: '/confirmation', title: `অর্ডার কনফার্মেশন | ${BRAND}`, desc: HOME_DESC, noindex: true },
  account: { path: '/account', title: `আমার অ্যাকাউন্ট | ${BRAND}`, desc: HOME_DESC, noindex: true },
  notfound: { path: null, title: `পেজটি পাওয়া যায়নি | ${BRAND}`, desc: HOME_DESC, noindex: true },
};

// Finds or creates a <meta>/<link> tag in <head> and sets one attribute on it
const setTag = (selector, create, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};
const setMeta = (name, content) => setTag(`meta[name="${name}"]`, { tag: 'meta', attrs: { name } }, 'content', content);
const setProp = (property, content) => setTag(`meta[property="${property}"]`, { tag: 'meta', attrs: { property } }, 'content', content);

const clip = (text, max) => {
  const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
};

const absoluteImage = (product) => {
  const first = [product.featuredImage, product.imageUrl, product.thumbnailUrl, product.images?.[0], product.gallery?.[0]]
    .map((v) => (typeof v === 'string' ? v : v?.url))
    .find(Boolean);
  if (!first) return `${SITE}/banners/trial-pack-packets.webp`;
  return /^https?:\/\//.test(first) ? first : `${SITE}${first.startsWith('/') ? '' : '/'}${first}`;
};

// Product structured data so Google can show price and stock in results
const productJsonLd = (product, url, image) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name_bn && product.name_bn !== product.name ? `${product.name} (${product.name_bn})` : product.name,
  image: [image],
  description: clip(product.description, 300),
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
});

// Keeps <title>, description, canonical, robots and Open Graph tags in step with the current page
export default function SeoHead() {
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
        desc = clip(`${product.name}${nameBn}। দাম ৳${product.price}। অরিজিনাল পণ্য, গোপন প্যাকেজিং ও ক্যাশ অন ডেলিভারি – সুরক্ষা (Surokkha Shop)।`, 160);
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
}
