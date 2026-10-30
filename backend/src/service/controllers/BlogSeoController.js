import { BlogPostModel } from "../../common/models/blogPost.model.js";
import { BlogCategoryModel } from "../../common/models/blogCategory.model.js";
import { BlogTagModel } from "../../common/models/blogTag.model.js";
import { SeoKeywordModel } from "../../common/models/seoKeyword.model.js";
import { SeoRedirectModel } from "../../common/models/seoRedirect.model.js";
import { SeoNotFoundModel } from "../../common/models/seoNotFound.model.js";
import { DEFAULT_ROBOTS } from "../../common/models/seoSettings.model.js";
import { logger } from "../../common/config/logger.js";
import { getPostIssues } from "../../common/utils/blogSeo.js";
import { getSeoSettings, getStorefrontBaseUrl, isObjectId, publicPostFilter } from "../../common/services/blog.service.js";

const SETTINGS_SECTIONS = ["meta", "social", "structuredData", "sitemap"];
const TREND_LENGTH = 7;

// Creates an error that carries the HTTP status the controller should answer with
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Sends a failure response using the error's own status when it has one
const fail = (res, err, fallback) => {
  if (err?.statusCode) return res.status(err.statusCode).json({ status: "error", message: err.message });
  logger.error({ err }, fallback);
  return res.status(500).json({ status: "error", message: fallback });
};

// Reads the signed-in user's id from the request
const userIdOf = (req) => req.user?._id || req.user?.id || null;

// Builds one audit row per problem found across all non-trashed posts
const collectAuditRows = async () => {
  const posts = await BlogPostModel.find({ status: { $ne: "trash" } })
    .select("title slug content wordCount coverImageAlt seo")
    .lean();
  const rows = [];
  let passed = 0;
  posts.forEach((post) => {
    const issues = getPostIssues(post);
    passed += Math.max(0, 5 - issues.length);
    issues.forEach((item, index) =>
      rows.push({
        id: `${post._id}-${index}`,
        postId: String(post._id),
        url: `/blog/${post.slug}`,
        title: post.title,
        type: "Post",
        issue: item.issue,
        severity: item.severity,
        score: post.seo?.score || 0,
      })
    );
  });
  rows.sort((a, b) => (a.severity === b.severity ? a.score - b.score : a.severity === "error" ? -1 : 1));
  return { rows, passed, pages: posts.length };
};

// GET /blog/seo/overview
export const getSeoOverview = async (req, res) => {
  try {
    const [{ rows, pages }, scoreRows, indexed, notFound, keywordCount, keywords] = await Promise.all([
      collectAuditRows(),
      BlogPostModel.aggregate([{ $match: { status: { $ne: "trash" } } }, { $group: { _id: null, avg: { $avg: "$seo.score" } } }]),
      BlogPostModel.countDocuments(publicPostFilter()),
      SeoNotFoundModel.countDocuments(),
      SeoKeywordModel.countDocuments(),
      SeoKeywordModel.find({ position: { $gt: 0 } }).sort({ position: 1 }).limit(4).lean(),
    ]);

    const grouped = new Map();
    rows.forEach((row) => {
      const entry = grouped.get(row.issue) || { issue: row.issue, severity: row.severity, count: 0 };
      entry.count += 1;
      grouped.set(row.issue, entry);
    });
    const issues = [...grouped.values()].sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "error" ? -1 : 1)).slice(0, 4);

    res.json({
      status: "success",
      data: {
        healthScore: Math.round(scoreRows[0]?.avg || 0),
        pages,
        indexedPosts: indexed,
        notFoundCount: notFound,
        keywordCount,
        issues,
        topKeywords: keywords.map((keyword) => ({ id: String(keyword._id), keyword: keyword.keyword, position: keyword.position, volume: keyword.volume })),
        search: null,
      },
    });
  } catch (err) {
    fail(res, err, "Unable to load SEO overview");
  }
};

// GET /blog/seo/audit
export const getSeoAudit = async (req, res) => {
  try {
    const { rows, passed, pages } = await collectAuditRows();
    const { severity = "", q = "" } = req.query;
    const needle = String(q).trim().toLowerCase();
    const filtered = rows.filter((row) => (!severity || row.severity === severity) && (!needle || row.url.toLowerCase().includes(needle) || row.title.toLowerCase().includes(needle)));

    res.json({
      status: "success",
      data: filtered,
      meta: {
        pages,
        passed,
        errors: rows.filter((row) => row.severity === "error").length,
        warnings: rows.filter((row) => row.severity === "warning").length,
        crawledAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    fail(res, err, "Unable to run site audit");
  }
};

// GET /blog/seo/settings
export const getSettings = async (req, res) => {
  try {
    res.json({ status: "success", data: await getSeoSettings() });
  } catch (err) {
    fail(res, err, "Unable to load SEO settings");
  }
};

// PUT /blog/seo/settings
export const updateSettings = async (req, res) => {
  try {
    const settings = await getSeoSettings();
    const body = req.body || {};

    SETTINGS_SECTIONS.forEach((section) => {
      if (body[section] && typeof body[section] === "object") {
        const current = settings[section]?.toObject ? settings[section].toObject() : { ...(settings[section] || {}) };
        settings[section] = { ...current, ...body[section] };
      }
    });
    if (body.robots !== undefined) settings.robots = String(body.robots || "").trim() || DEFAULT_ROBOTS;
    settings.updatedBy = userIdOf(req);

    await settings.save();
    res.json({ status: "success", data: settings });
  } catch (err) {
    fail(res, err, "Unable to save SEO settings");
  }
};

// GET /blog/seo/sitemap
export const getSitemapInfo = async (req, res) => {
  try {
    const [settings, posts, categories, tags] = await Promise.all([
      getSeoSettings(),
      BlogPostModel.countDocuments(publicPostFilter()),
      BlogCategoryModel.countDocuments(),
      BlogTagModel.countDocuments(),
    ]);
    const base = getStorefrontBaseUrl();
    res.json({
      status: "success",
      data: {
        url: `${base}/sitemap.xml`,
        sources: { posts: `${base}/blog` },
        sections: [
          { key: "posts", title: "Blog posts", urls: posts, enabled: settings.sitemap?.posts !== false },
          { key: "taxonomy", title: "Categories & tags", urls: categories + tags, enabled: settings.sitemap?.taxonomy !== false },
        ],
        lastGeneratedAt: settings.sitemap?.lastGeneratedAt || null,
        robots: settings.robots,
        defaultRobots: DEFAULT_ROBOTS,
      },
    });
  } catch (err) {
    fail(res, err, "Unable to load sitemap info");
  }
};

// POST /blog/seo/sitemap/regenerate
export const regenerateSitemap = async (req, res) => {
  try {
    const settings = await getSeoSettings();
    settings.sitemap = { ...(settings.sitemap?.toObject ? settings.sitemap.toObject() : settings.sitemap), lastGeneratedAt: new Date() };
    await settings.save();
    res.json({ status: "success", data: { lastGeneratedAt: settings.sitemap.lastGeneratedAt } });
  } catch (err) {
    fail(res, err, "Unable to regenerate sitemap");
  }
};

// Summarises tracked keywords for the stat cards
const keywordStats = async () => {
  const [tracked, top10, avg] = await Promise.all([
    SeoKeywordModel.countDocuments(),
    SeoKeywordModel.countDocuments({ position: { $gt: 0, $lte: 10 } }),
    SeoKeywordModel.aggregate([{ $match: { position: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: "$position" } } }]),
  ]);
  return { tracked, top10, avgPosition: Math.round((avg[0]?.avg || 0) * 10) / 10 };
};

// Shapes a keyword document for the dashboard, including position change
const presentKeyword = (keyword) => ({
  id: String(keyword._id),
  keyword: keyword.keyword,
  page: keyword.page,
  position: keyword.position,
  change: keyword.previousPosition && keyword.position ? keyword.previousPosition - keyword.position : 0,
  volume: keyword.volume,
  trend: keyword.trend || [],
  country: keyword.country,
});

// GET /blog/seo/keywords
export const listKeywords = async (req, res) => {
  try {
    const needle = String(req.query.q || "").trim().toLowerCase();
    const filter = needle ? { keyword: { $regex: needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } } : {};
    const [keywords, stats] = await Promise.all([SeoKeywordModel.find(filter).sort({ position: 1, keyword: 1 }).lean(), keywordStats()]);
    res.json({ status: "success", data: keywords.map(presentKeyword), meta: stats });
  } catch (err) {
    fail(res, err, "Unable to fetch keywords");
  }
};

// Parses a non-negative whole number from user input
const toCount = (value) => Math.max(0, Math.round(Number(value) || 0));

// POST /blog/seo/keywords
export const createKeyword = async (req, res) => {
  try {
    const { keyword, page, position, volume, country } = req.body || {};
    const name = String(keyword || "").trim().toLowerCase();
    if (!name) throw httpError(400, "Keyword is required");
    if (await SeoKeywordModel.exists({ keyword: name })) throw httpError(409, "This keyword is already tracked");

    const created = await SeoKeywordModel.create({
      keyword: name,
      page: String(page || "").trim(),
      position: toCount(position),
      volume: toCount(volume),
      trend: toCount(position) ? [toCount(position)] : [],
      country: String(country || "BD").trim().toUpperCase(),
      createdBy: userIdOf(req),
    });
    res.status(201).json({ status: "success", data: presentKeyword(created) });
  } catch (err) {
    fail(res, err, "Unable to add keyword");
  }
};

// PUT /blog/seo/keywords/:id
export const updateKeyword = async (req, res) => {
  try {
    const keyword = isObjectId(req.params.id) ? await SeoKeywordModel.findById(req.params.id) : null;
    if (!keyword) throw httpError(404, "Keyword not found");
    const { page, position, volume } = req.body || {};

    if (page !== undefined) keyword.page = String(page || "").trim();
    if (volume !== undefined) keyword.volume = toCount(volume);
    if (position !== undefined && toCount(position) !== keyword.position) {
      keyword.previousPosition = keyword.position;
      keyword.position = toCount(position);
      keyword.trend = [...(keyword.trend || []), keyword.position].slice(-TREND_LENGTH);
    }

    await keyword.save();
    res.json({ status: "success", data: presentKeyword(keyword) });
  } catch (err) {
    fail(res, err, "Unable to update keyword");
  }
};

// DELETE /blog/seo/keywords/:id
export const deleteKeyword = async (req, res) => {
  try {
    const removed = isObjectId(req.params.id) ? await SeoKeywordModel.findByIdAndDelete(req.params.id) : null;
    if (!removed) throw httpError(404, "Keyword not found");
    res.json({ status: "success", message: "Keyword removed" });
  } catch (err) {
    fail(res, err, "Unable to remove keyword");
  }
};

// Normalises a redirect path to start with a single slash
export const normalizePath = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `/${trimmed.replace(/^\/+/, "")}`;
};

// GET /blog/seo/redirects
export const listRedirects = async (req, res) => {
  try {
    const redirects = await SeoRedirectModel.find().sort({ createdAt: -1 }).lean();
    res.json({ status: "success", data: redirects.map((redirect) => ({ ...redirect, id: String(redirect._id) })) });
  } catch (err) {
    fail(res, err, "Unable to fetch redirects");
  }
};

// Validates and cleans a redirect payload, throwing on bad input
const parseRedirectInput = (body, partial = false) => {
  const out = {};
  if (!partial || body.from !== undefined) {
    out.from = normalizePath(body.from);
    if (!out.from || /^https?:\/\//i.test(out.from)) throw httpError(400, "From must be a path such as /old-url");
  }
  if (!partial || body.type !== undefined) {
    out.type = Number(body.type || 301);
    if (![301, 302, 410].includes(out.type)) throw httpError(400, "Type must be 301, 302 or 410");
  }
  if (!partial || body.to !== undefined) out.to = normalizePath(body.to);
  if (body.active !== undefined) out.active = Boolean(body.active);
  return out;
};

// POST /blog/seo/redirects
export const createRedirect = async (req, res) => {
  try {
    const data = parseRedirectInput(req.body || {});
    if (data.type !== 410 && !data.to) throw httpError(400, "Destination is required");
    if (data.to === data.from) throw httpError(400, "From and to cannot be the same");
    if (await SeoRedirectModel.exists({ from: data.from })) throw httpError(409, "A redirect from this path already exists");

    const redirect = await SeoRedirectModel.create({ ...data, createdBy: userIdOf(req) });
    await SeoNotFoundModel.deleteOne({ url: data.from });
    res.status(201).json({ status: "success", data: redirect });
  } catch (err) {
    fail(res, err, "Unable to create redirect");
  }
};

// PUT /blog/seo/redirects/:id
export const updateRedirect = async (req, res) => {
  try {
    const redirect = isObjectId(req.params.id) ? await SeoRedirectModel.findById(req.params.id) : null;
    if (!redirect) throw httpError(404, "Redirect not found");

    const data = parseRedirectInput(req.body || {}, true);
    if (data.from && data.from !== redirect.from && (await SeoRedirectModel.exists({ from: data.from }))) throw httpError(409, "A redirect from this path already exists");
    redirect.set(data);
    if (redirect.type !== 410 && !redirect.to) throw httpError(400, "Destination is required");

    await redirect.save();
    res.json({ status: "success", data: redirect });
  } catch (err) {
    fail(res, err, "Unable to update redirect");
  }
};

// DELETE /blog/seo/redirects/:id
export const deleteRedirect = async (req, res) => {
  try {
    const removed = isObjectId(req.params.id) ? await SeoRedirectModel.findByIdAndDelete(req.params.id) : null;
    if (!removed) throw httpError(404, "Redirect not found");
    res.json({ status: "success", message: "Redirect deleted" });
  } catch (err) {
    fail(res, err, "Unable to delete redirect");
  }
};

// GET /blog/seo/not-found
export const listNotFound = async (req, res) => {
  try {
    const rows = await SeoNotFoundModel.find().sort({ hits: -1, lastSeenAt: -1 }).limit(100).lean();
    res.json({ status: "success", data: rows.map((row) => ({ ...row, id: String(row._id) })) });
  } catch (err) {
    fail(res, err, "Unable to fetch 404 log");
  }
};

// DELETE /blog/seo/not-found/:id
export const deleteNotFound = async (req, res) => {
  try {
    const removed = isObjectId(req.params.id) ? await SeoNotFoundModel.findByIdAndDelete(req.params.id) : null;
    if (!removed) throw httpError(404, "Entry not found");
    res.json({ status: "success", message: "Entry cleared" });
  } catch (err) {
    fail(res, err, "Unable to clear 404 entry");
  }
};
