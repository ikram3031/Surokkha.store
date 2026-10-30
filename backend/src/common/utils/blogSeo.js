export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 80,
  descriptionMax: 160,
  minWords: 300,
};

// Turns any text into a URL slug, keeping letters from every script
export const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// Removes HTML tags and collapses whitespace
export const stripHtml = (html = "") =>
  String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Counts words in an HTML string
export const countWords = (html = "") => {
  const text = stripHtml(html);
  return text ? text.split(" ").length : 0;
};

// Estimates reading time in whole minutes at 200 words per minute
export const readingMinutesFor = (wordCount = 0) => (wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0);

// Runs the seven SEO checks the post editor shows, in the same order
export const getSeoChecks = (post = {}) => {
  const keyword = String(post.seo?.focusKeyword || "").trim().toLowerCase();
  const title = String(post.seo?.metaTitle || post.title || "");
  const description = String(post.seo?.metaDescription || "");
  const words = post.wordCount ?? countWords(post.content);

  return [
    { key: "keywordInTitle", label: "Focus keyword appears in the meta title", ok: Boolean(keyword) && title.toLowerCase().includes(keyword) },
    { key: "keywordInDescription", label: "Focus keyword appears in the meta description", ok: Boolean(keyword) && description.toLowerCase().includes(keyword) },
    { key: "titleLength", label: `Meta title is ${SEO_LIMITS.titleMin}–${SEO_LIMITS.titleMax} characters`, ok: title.length >= SEO_LIMITS.titleMin && title.length <= SEO_LIMITS.titleMax },
    { key: "descriptionLength", label: `Meta description is ${SEO_LIMITS.descriptionMin}–${SEO_LIMITS.descriptionMax} characters`, ok: description.length >= SEO_LIMITS.descriptionMin && description.length <= SEO_LIMITS.descriptionMax },
    { key: "slug", label: "Permalink is set", ok: Boolean(post.slug) },
    { key: "coverAlt", label: "Featured image has alt text", ok: Boolean(post.coverImageAlt) },
    { key: "content", label: `Content has at least ${SEO_LIMITS.minWords} words`, ok: words >= SEO_LIMITS.minWords },
  ];
};

// Converts the passed checks into a 0-100 score
export const computeSeoScore = (post = {}) => {
  const checks = getSeoChecks(post);
  return Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
};

// Lists the concrete problems found on one post for the site audit
export const getPostIssues = (post = {}) => {
  const title = String(post.seo?.metaTitle || post.title || "");
  const description = String(post.seo?.metaDescription || "");
  const words = post.wordCount ?? countWords(post.content);
  const issues = [];

  if (!description) issues.push({ issue: "Missing meta description", severity: "error" });
  else if (description.length > SEO_LIMITS.descriptionMax) issues.push({ issue: `Meta description longer than ${SEO_LIMITS.descriptionMax} characters`, severity: "warning" });
  else if (description.length < SEO_LIMITS.descriptionMin) issues.push({ issue: `Meta description shorter than ${SEO_LIMITS.descriptionMin} characters`, severity: "warning" });

  if (title.length > SEO_LIMITS.titleMax) issues.push({ issue: `Meta title longer than ${SEO_LIMITS.titleMax} characters`, severity: "warning" });
  else if (title.length < SEO_LIMITS.titleMin) issues.push({ issue: `Meta title shorter than ${SEO_LIMITS.titleMin} characters`, severity: "warning" });

  if (!post.seo?.focusKeyword) issues.push({ issue: "No focus keyword set", severity: "warning" });
  if (!post.coverImageAlt) issues.push({ issue: "Featured image has no alt text", severity: "warning" });
  if (words < SEO_LIMITS.minWords) issues.push({ issue: `Thin content (under ${SEO_LIMITS.minWords} words)`, severity: "warning" });

  return issues;
};

// Fills a title or description template with post values
export const applyTemplate = (template = "", values = {}) =>
  String(template)
    .replaceAll("%post_title%", values.postTitle || "")
    .replaceAll("%excerpt%", values.excerpt || "")
    .replaceAll("%category%", values.category || "")
    .replaceAll("%author%", values.author || "")
    .replaceAll("%site_name%", values.siteName || "")
    .replaceAll("%sep%", values.separator || "|")
    .replaceAll("%year%", String(new Date().getFullYear()))
    .replace(/\s+/g, " ")
    .trim();
