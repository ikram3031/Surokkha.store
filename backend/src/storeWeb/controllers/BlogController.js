import { BlogPostModel } from "../../common/models/blogPost.model.js";
import { BlogCategoryModel } from "../../common/models/blogCategory.model.js";
import { BlogTagModel } from "../../common/models/blogTag.model.js";
import { BlogCommentModel } from "../../common/models/blogComment.model.js";
import { BlogViewDailyModel } from "../../common/models/blogViewDaily.model.js";
import { SeoRedirectModel } from "../../common/models/seoRedirect.model.js";
import { SeoNotFoundModel } from "../../common/models/seoNotFound.model.js";
import { logger } from "../../common/config/logger.js";
import { getClientIp } from "../../common/utils/clientIp.js";
import { applyTemplate, stripHtml } from "../../common/utils/blogSeo.js";
import {
  buildSitemapXml,
  countsByTag,
  dayKey,
  getSeoSettings,
  getStorefrontBaseUrl,
  publicPostFilter,
  publishedCountsByCategory,
  resolveCategoryIds,
  sanitizePlainText,
} from "../../common/services/blog.service.js";

const LIST_FIELDS = "title slug excerpt coverImageUrl coverImageAlt publishedAt categories tags authorName readingMinutes views isFeatured";
const COMMENT_WINDOW_MS = 10 * 60 * 1000;
const COMMENT_LIMIT = 5;

// Escapes user text for use inside a regular expression
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shapes a post for public output with its categories and a stable id
const presentPost = (post) => ({
  ...post,
  id: String(post._id),
  categories: (post.categories || []).map((category) => ({ id: String(category._id), name: category.name, slug: category.slug })),
});

// Builds the head tags and JSON-LD a storefront page needs for one post
const buildPostSeo = (post, settings) => {
  const base = getStorefrontBaseUrl();
  const url = `${base}/blog/${post.slug}`;
  const meta = settings.meta || {};
  const values = {
    postTitle: post.title,
    excerpt: post.excerpt || stripHtml(post.content).slice(0, 160),
    category: post.categories?.[0]?.name || "",
    author: post.authorName,
    siteName: meta.siteName,
    separator: meta.separator,
  };
  const title = post.seo?.metaTitle || applyTemplate(meta.postTitleTemplate, values);
  const description = post.seo?.metaDescription || applyTemplate(meta.postDescriptionTemplate, values);
  const image = post.coverImageUrl || settings.social?.defaultImage || "";
  const robots = meta.indexPosts === false ? "noindex,follow" : post.seo?.robots || "index,follow";
  const structured = settings.structuredData || {};

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": structured.postType || "BlogPosting",
    headline: post.title,
    description,
    image: image || undefined,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : undefined,
    publisher: structured.organizationName
      ? { "@type": "Organization", name: structured.organizationName, logo: structured.logoUrl ? { "@type": "ImageObject", url: structured.logoUrl } : undefined }
      : undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    mainEntityOfPage: url,
  };

  return {
    title,
    description,
    canonical: post.seo?.canonicalUrl || url,
    robots,
    openGraph: settings.social?.ogEnabled === false ? null : { type: "article", title, description, image, url, siteName: meta.siteName, appId: settings.social?.facebookAppId || undefined },
    twitter: settings.social?.twitterEnabled === false ? null : { card: settings.social?.twitterCard || "summary_large_image", title, description, image },
    jsonLd,
    breadcrumbs: structured.breadcrumbs !== false,
  };
};

// GET /blog/posts
export const listPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const filter = publicPostFilter();
    const and = [];

    if (req.query.category) {
      const [categoryId] = await resolveCategoryIds([req.query.category]);
      and.push({ categories: categoryId || { $in: [] } });
    }
    if (req.query.tag) and.push({ tags: String(req.query.tag).toLowerCase() });
    if (req.query.q) and.push({ title: { $regex: escapeRegex(String(req.query.q).trim()), $options: "i" } });
    if (req.query.featured === "true") and.push({ isFeatured: true });
    const query = and.length ? { $and: [filter, ...and] } : filter;

    const [posts, total] = await Promise.all([
      BlogPostModel.find(query).select(LIST_FIELDS).populate({ path: "categories", select: "name slug" }).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      BlogPostModel.countDocuments(query),
    ]);

    res.json({ status: "success", data: posts.map(presentPost), meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error({ err }, "Failed to list public blog posts");
    res.status(500).json({ status: "error", message: "Unable to retrieve posts" });
  }
};

// GET /blog/posts/:slug
export const getPostBySlug = async (req, res) => {
  try {
    const post = await BlogPostModel.findOne({ $and: [publicPostFilter(), { slug: req.params.slug }] })
      .populate({ path: "categories", select: "name slug" })
      .lean();
    if (!post) return res.status(404).json({ status: "error", message: "Post not found" });

    const [related, settings] = await Promise.all([
      BlogPostModel.find({
        $and: [publicPostFilter(), { _id: { $ne: post._id } }, { $or: [{ categories: { $in: post.categories.map((category) => category._id) } }, { tags: { $in: post.tags || [] } }] }],
      })
        .select(LIST_FIELDS)
        .populate({ path: "categories", select: "name slug" })
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean(),
      getSeoSettings(),
    ]);

    res.json({ status: "success", data: { ...presentPost(post), related: related.map(presentPost), seo: { ...post.seo, ...buildPostSeo(post, settings) } } });
  } catch (err) {
    logger.error({ err }, "Failed to fetch public blog post");
    res.status(500).json({ status: "error", message: "Unable to retrieve post" });
  }
};

// POST /blog/posts/:slug/view
export const recordView = async (req, res) => {
  try {
    const post = await BlogPostModel.findOneAndUpdate({ $and: [publicPostFilter(), { slug: req.params.slug }] }, { $inc: { views: 1 } }, { projection: "_id" });
    if (post) await BlogViewDailyModel.updateOne({ day: dayKey() }, { $inc: { count: 1 } }, { upsert: true });
    res.json({ status: "success" });
  } catch (err) {
    logger.error({ err }, "Failed to record blog view");
    res.status(500).json({ status: "error", message: "Unable to record view" });
  }
};

// GET /blog/posts/:slug/comments
export const listComments = async (req, res) => {
  try {
    const post = await BlogPostModel.findOne({ $and: [publicPostFilter(), { slug: req.params.slug }] }).select("_id allowComments");
    if (!post) return res.status(404).json({ status: "error", message: "Post not found" });

    const comments = await BlogCommentModel.find({ postId: post._id, status: "approved" }).sort({ createdAt: 1 }).select("authorName body parent isStaff createdAt").lean();
    res.json({
      status: "success",
      data: comments.map((comment) => ({ id: String(comment._id), authorName: comment.authorName, body: comment.body, parent: comment.parent ? String(comment.parent) : null, isStaff: comment.isStaff, createdAt: comment.createdAt })),
      meta: { allowComments: post.allowComments },
    });
  } catch (err) {
    logger.error({ err }, "Failed to list public blog comments");
    res.status(500).json({ status: "error", message: "Unable to retrieve comments" });
  }
};

// POST /blog/posts/:slug/comments
export const submitComment = async (req, res) => {
  try {
    const { name, email, body, website } = req.body || {};
    if (website) return res.status(201).json({ status: "success", message: "Thanks! Your comment is awaiting review." });

    const authorName = sanitizePlainText(name, 80);
    const authorEmail = sanitizePlainText(email, 120).toLowerCase();
    const text = sanitizePlainText(body, 2000);
    if (!authorName || text.length < 3) return res.status(400).json({ status: "error", message: "Name and a comment of at least 3 characters are required" });
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) return res.status(400).json({ status: "error", message: "Invalid email address" });

    const post = await BlogPostModel.findOne({ $and: [publicPostFilter(), { slug: req.params.slug }] }).select("title slug allowComments");
    if (!post) return res.status(404).json({ status: "error", message: "Post not found" });
    if (!post.allowComments) return res.status(403).json({ status: "error", message: "Comments are closed for this post" });

    const ip = getClientIp(req);
    const recent = await BlogCommentModel.countDocuments({ ip, createdAt: { $gte: new Date(Date.now() - COMMENT_WINDOW_MS) } });
    if (recent >= COMMENT_LIMIT) return res.status(429).json({ status: "error", message: "Too many comments. Please try again later." });

    await BlogCommentModel.create({
      postId: post._id,
      postTitle: post.title,
      postSlug: post.slug,
      authorName,
      authorEmail,
      body: text,
      ip,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
      status: "pending",
    });
    res.status(201).json({ status: "success", message: "Thanks! Your comment is awaiting review." });
  } catch (err) {
    logger.error({ err }, "Failed to submit blog comment");
    res.status(500).json({ status: "error", message: "Unable to submit comment" });
  }
};

// GET /blog/categories
export const listCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([BlogCategoryModel.find().sort({ name: 1 }).lean(), publishedCountsByCategory()]);
    const data = categories
      .map((category) => ({ id: String(category._id), name: category.name, slug: category.slug, description: category.description, seoTitle: category.seoTitle, parent: category.parent ? String(category.parent) : null, postCount: counts.get(String(category._id)) || 0 }))
      .filter((category) => category.postCount > 0);
    res.json({ status: "success", data });
  } catch (err) {
    logger.error({ err }, "Failed to list public blog categories");
    res.status(500).json({ status: "error", message: "Unable to retrieve categories" });
  }
};

// GET /blog/tags
export const listTags = async (req, res) => {
  try {
    const [tags, counts] = await Promise.all([BlogTagModel.find().sort({ name: 1 }).lean(), countsByTag(true)]);
    const data = tags
      .map((tag) => ({ id: String(tag._id), name: tag.name, slug: tag.slug, postCount: counts.get(tag.name) || 0 }))
      .filter((tag) => tag.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount);
    res.json({ status: "success", data });
  } catch (err) {
    logger.error({ err }, "Failed to list public blog tags");
    res.status(500).json({ status: "error", message: "Unable to retrieve tags" });
  }
};

// GET /blog/seo/settings
export const getPublicSeoSettings = async (req, res) => {
  try {
    const settings = await getSeoSettings();
    res.json({ status: "success", data: { meta: settings.meta, social: settings.social, structuredData: settings.structuredData } });
  } catch (err) {
    logger.error({ err }, "Failed to load public SEO settings");
    res.status(500).json({ status: "error", message: "Unable to retrieve SEO settings" });
  }
};

// GET /blog/sitemap.xml
export const getSitemap = async (req, res) => {
  try {
    const settings = await getSeoSettings();
    res.type("application/xml").send(await buildSitemapXml(settings));
  } catch (err) {
    logger.error({ err }, "Failed to build sitemap");
    res.status(500).type("text/plain").send("Unable to build sitemap");
  }
};

// GET /blog/robots.txt
export const getRobots = async (req, res) => {
  try {
    const settings = await getSeoSettings();
    const base = getStorefrontBaseUrl();
    const hasSitemap = /^\s*sitemap:/im.test(settings.robots);
    res.type("text/plain").send(`${settings.robots}${hasSitemap || !base ? "" : `\n\nSitemap: ${base}/sitemap.xml`}\n`);
  } catch (err) {
    logger.error({ err }, "Failed to serve robots.txt");
    res.status(500).type("text/plain").send("User-agent: *\nAllow: /\n");
  }
};

// GET /blog/seo/redirect?path=/old-url
export const resolveRedirect = async (req, res) => {
  try {
    const path = `/${String(req.query.path || "").trim().replace(/^\/+/, "")}`;
    const rule = await SeoRedirectModel.findOneAndUpdate({ from: path, active: true }, { $inc: { hits: 1 } }, { new: true }).lean();
    if (!rule) return res.json({ status: "success", data: null });
    res.json({ status: "success", data: { to: rule.to, type: rule.type } });
  } catch (err) {
    logger.error({ err }, "Failed to resolve redirect");
    res.status(500).json({ status: "error", message: "Unable to resolve redirect" });
  }
};

// POST /blog/seo/404
export const reportNotFound = async (req, res) => {
  try {
    const url = `/${String(req.body?.url || "").trim().replace(/^\/+/, "")}`.slice(0, 300);
    if (url === "/") return res.status(400).json({ status: "error", message: "url is required" });
    const referrer = sanitizePlainText(req.body?.referrer, 300);

    await SeoNotFoundModel.updateOne({ url }, { $inc: { hits: 1 }, $set: { lastSeenAt: new Date(), ...(referrer ? { referrer } : {}) } }, { upsert: true });
    res.status(202).json({ status: "success" });
  } catch (err) {
    logger.error({ err }, "Failed to record 404");
    res.status(500).json({ status: "error", message: "Unable to record 404" });
  }
};
