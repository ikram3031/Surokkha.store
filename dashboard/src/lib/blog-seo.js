export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 80,
  descriptionMax: 160,
  minWords: 300,
};

// Removes HTML tags and collapses whitespace
export const stripHtml = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Counts words in an HTML string
export const countWords = (html = '') => {
  const text = stripHtml(html);
  return text ? text.split(' ').length : 0;
};

// Turns any text into a URL slug, keeping letters from every script
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Runs the same seven checks the backend uses to score a post
export const getSeoChecks = ({ title, slug, content, coverImageAlt, focusKeyword, metaTitle, metaDescription }) => {
  const keyword = String(focusKeyword || '').trim().toLowerCase();
  const effectiveTitle = String(metaTitle || title || '');
  const description = String(metaDescription || '');

  return [
    { key: 'keywordInTitle', label: 'Focus keyword appears in the meta title', ok: Boolean(keyword) && effectiveTitle.toLowerCase().includes(keyword) },
    { key: 'keywordInDescription', label: 'Focus keyword appears in the meta description', ok: Boolean(keyword) && description.toLowerCase().includes(keyword) },
    { key: 'titleLength', label: `Meta title is ${SEO_LIMITS.titleMin}–${SEO_LIMITS.titleMax} characters`, ok: effectiveTitle.length >= SEO_LIMITS.titleMin && effectiveTitle.length <= SEO_LIMITS.titleMax },
    { key: 'descriptionLength', label: `Meta description is ${SEO_LIMITS.descriptionMin}–${SEO_LIMITS.descriptionMax} characters`, ok: description.length >= SEO_LIMITS.descriptionMin && description.length <= SEO_LIMITS.descriptionMax },
    { key: 'slug', label: 'Permalink is set', ok: Boolean(slug) },
    { key: 'coverAlt', label: 'Featured image has alt text', ok: Boolean(coverImageAlt) },
    { key: 'content', label: `Content has at least ${SEO_LIMITS.minWords} words`, ok: countWords(content) >= SEO_LIMITS.minWords },
  ];
};

// Converts the passed checks into a 0-100 score
export const computeSeoScore = (fields) => {
  const checks = getSeoChecks(fields);
  return Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
};

// Formats an ISO date for lists, e.g. "Oct 28, 2026"
export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

// Formats an ISO date as a short relative time such as "2h ago"
export const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(value);
};

// Converts an ISO date to the value a datetime-local input expects
export const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
