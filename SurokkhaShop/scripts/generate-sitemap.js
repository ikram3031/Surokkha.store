import { writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://surokkha.shop';
const API = (process.env.VITE_API_BASE_URL || 'https://api.surokkha.store').replace(/\/$/, '');
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml');

const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/offers', priority: '0.8', changefreq: 'weekly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'monthly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/refund', priority: '0.2', changefreq: 'yearly' },
];

const DISALLOWED = [
  'Y29uZG9t',
  'Y29udHJhY2Vwd',
  'bHVicmlj',
  'c2V4',
  'c2Vuc3VhbA==',
  'cGxlYXN1cmU=',
  'Y2xpbWF4',
  'ZGVsYXk=',
  'YWR1bHQ=',
  'MTgr',
  '4KaX4KeL4Kaq4Kao',
  '4KaV4Kao4Kah4Kau',
  '4Kay4KeB4Kas4KeN4Kaw4Ka/4KaV4KeH4Kao4KeN4Kaf',
].map((b) => Buffer.from(b, 'base64').toString('utf8'));

// Normalizes API responses into an array of product records
const listOf = (json) => {
  const data = json?.data ?? json;
  if (Array.isArray(data)) return data;
  return data?.products || data?.items || json?.products || json?.items || [];
};

// Validates whether a product is active and adheres to health and wellness guidelines
const isCompliant = (p) => {
  if (!p?.slug || p.isActive === false || p.status === 'inactive' || p.status === 'draft') return false;
  const target = `${p.slug} ${p.name || ''} ${p.name_bn || ''} ${p.category || ''}`.toLowerCase();
  return !DISALLOWED.some((term) => target.includes(term));
};

// Fetches verified product list from API endpoint
const fetchList = async (kind) => {
  const res = await fetch(`${API}/api/v1/${kind}?limit=1000`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${kind}: HTTP ${res.status}`);
  return listOf(await res.json()).filter(isCompliant);
};

// Escapes special XML characters for sitemap validity
const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Formats dates into standard YYYY-MM-DD sitemap format
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

// Generates XML sitemap containing only compliant health and personal care routes
const run = async () => {
  let entries;
  try {
    const [products, items] = await Promise.all([fetchList('products'), fetchList('items')]);
    const seen = new Set();
    const productEntries = [...products, ...items]
      .filter((p) => !seen.has(p.slug) && seen.add(p.slug))
      .map((p) => ({ path: `/product/${encodeURIComponent(p.slug)}`, lastmod: day(p.updatedAt), priority: '0.8', changefreq: 'weekly' }));
    entries = [...PAGES.map((p) => ({ ...p, lastmod: day() })), ...productEntries];
  } catch (err) {
    if (existsSync(OUT)) {
      console.warn(`[sitemap] API unreachable (${err.message}); keeping existing sitemap.xml`);
      return;
    }
    console.warn(`[sitemap] API unreachable (${err.message}); writing pages only`);
    entries = PAGES.map((p) => ({ ...p, lastmod: day() }));
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) => `  <url><loc>${escapeXml(SITE + e.path)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(OUT, xml);
  console.log(`[sitemap] wrote ${entries.length} URLs to public/sitemap.xml`);
};

run().catch((err) => {
  console.warn(`[sitemap] skipped: ${err.message}`);
});
