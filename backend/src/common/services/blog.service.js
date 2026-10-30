import { BlogPostModel } from "../models/blogPost.model.js";
import { BlogCategoryModel } from "../models/blogCategory.model.js";
import { BlogTagModel } from "../models/blogTag.model.js";
import { SeoSettingsModel } from "../models/seoSettings.model.js";
import { config } from "../config/index.js";
import { slugify } from "../utils/blogSeo.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (value) => typeof value === "string" && OBJECT_ID.test(value);

// Builds a lookup filter that accepts an ObjectId, did or slug
export const idOrSlugFilter = (value) =>
  isObjectId(value) ? { $or: [{ _id: value }, { slug: value }, { did: value }] } : { $or: [{ slug: value }, { did: value }] };

// Returns a slug not used by any other document in the model
export const ensureUniqueSlug = async (Model, base, excludeId = null) => {
  const root = slugify(base) || "post";
  let candidate = root;
  let suffix = 2;
  const taken = async (slug) => {
    const filter = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    return Boolean(await Model.exists(filter));
  };
  while (await taken(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

// Normalises a tag list to unique lowercase names
export const cleanTagNames = (tags) => {
  const list = Array.isArray(tags) ? tags : [];
  return [...new Set(list.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean))];
};

// Makes sure every tag name used by a post exists in the tag collection
export const syncTags = async (names) => {
  const list = cleanTagNames(names);
  if (!list.length) return;
  await BlogTagModel.bulkWrite(
    list.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name, slug: slugify(name) || name } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
};

// Resolves category ids, slugs or dids into ObjectIds, skipping unknown values
export const resolveCategoryIds = async (values) => {
  const list = (Array.isArray(values) ? values : []).map((value) => String(value?.id || value?._id || value || "")).filter(Boolean);
  if (!list.length) return [];
  const found = await BlogCategoryModel.find({
    $or: [{ _id: { $in: list.filter(isObjectId) } }, { slug: { $in: list } }, { did: { $in: list } }],
  })
    .select("_id")
    .lean();
  return found.map((category) => category._id);
};

// Matches only posts visitors may read: published or past their schedule, and public
export const publicPostFilter = (now = new Date()) => ({
  visibility: "public",
  $or: [{ status: "published" }, { status: "scheduled", scheduledAt: { $lte: now } }],
});

// Counts published posts per category id
export const publishedCountsByCategory = async () => {
  const rows = await BlogPostModel.aggregate([
    { $match: publicPostFilter() },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
};

// Counts posts per tag name, optionally limited to public posts
export const countsByTag = async (publicOnly = false) => {
  const rows = await BlogPostModel.aggregate([
    { $match: publicOnly ? publicPostFilter() : { status: { $ne: "trash" } } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
};

// Loads the singleton SEO settings document, creating it with defaults on first use
export const getSeoSettings = async () => {
  const defaults = {
    meta: { siteName: config?.brandName || "" },
    structuredData: { organizationName: config?.brandName || "" },
  };
  return SeoSettingsModel.findOneAndUpdate({ key: "blog" }, { $setOnInsert: { key: "blog", ...defaults } }, { upsert: true, new: true, setDefaultsOnInsert: true });
};

// Returns the public storefront base URL without a trailing slash
export const getStorefrontBaseUrl = () => String(config?.storefrontUrl || (config?.domain ? `https://${config.domain}` : "")).replace(/\/+$/, "");

// Escapes text for safe inclusion in XML
export const escapeXml = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Builds the sitemap XML for blog URLs according to the saved sitemap settings
export const buildSitemapXml = async (settings) => {
  const base = getStorefrontBaseUrl();
  const entries = [{ loc: `${base}/blog`, lastmod: new Date() }];

  if (settings.sitemap?.posts !== false) {
    const posts = await BlogPostModel.find(publicPostFilter()).select("slug updatedAt seo.robots").lean();
    posts
      .filter((post) => !String(post.seo?.robots || "").startsWith("noindex"))
      .forEach((post) => entries.push({ loc: `${base}/blog/${post.slug}`, lastmod: post.updatedAt }));
  }

  if (settings.sitemap?.taxonomy !== false) {
    const [categories, tags] = await Promise.all([BlogCategoryModel.find().select("slug updatedAt").lean(), BlogTagModel.find().select("slug updatedAt").lean()]);
    categories.forEach((category) => entries.push({ loc: `${base}/blog/category/${category.slug}`, lastmod: category.updatedAt }));
    tags.forEach((tag) => entries.push({ loc: `${base}/blog/tag/${tag.slug}`, lastmod: tag.updatedAt }));
  }

  const urls = entries
    .map((entry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${new Date(entry.lastmod || Date.now()).toISOString()}</lastmod>\n  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

// Strips HTML and control characters from visitor-submitted text
export const sanitizePlainText = (value = "", maxLength = 2000) =>
  String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);

// Formats a Date as YYYY-MM-DD in UTC
export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
