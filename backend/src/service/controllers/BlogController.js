import { BlogPostModel, BLOG_POST_STATUSES } from "../../common/models/blogPost.model.js";
import { BlogCategoryModel } from "../../common/models/blogCategory.model.js";
import { BlogTagModel } from "../../common/models/blogTag.model.js";
import { BlogCommentModel, BLOG_COMMENT_STATUSES } from "../../common/models/blogComment.model.js";
import { BlogViewDailyModel } from "../../common/models/blogViewDaily.model.js";
import { SeoRedirectModel } from "../../common/models/seoRedirect.model.js";
import { logger } from "../../common/config/logger.js";
import { computeSeoScore, countWords, readingMinutesFor, slugify } from "../../common/utils/blogSeo.js";
import {
  cleanTagNames,
  countsByTag,
  dayKey,
  ensureUniqueSlug,
  idOrSlugFilter,
  isObjectId,
  resolveCategoryIds,
  sanitizePlainText,
  syncTags,
} from "../../common/services/blog.service.js";

const POST_LIST_FIELDS = "-content";
const SEO_TEXT_FIELDS = ["focusKeyword", "metaTitle", "metaDescription", "canonicalUrl"];
const ROBOTS_VALUES = ["index,follow", "noindex,follow", "noindex,nofollow"];

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

// Applies the requested status and its publish/schedule dates to a post document
const applyStatus = (post, body) => {
  const status = body.status ?? post.status ?? "draft";
  if (!BLOG_POST_STATUSES.includes(status)) throw httpError(400, "Invalid post status");

  if (status === "scheduled") {
    const when = new Date(body.scheduledAt ?? post.scheduledAt);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) throw httpError(400, "Choose a future date to schedule this post");
    post.scheduledAt = when;
    post.publishedAt = when;
  } else if (status === "published") {
    const requested = body.publishedAt ? new Date(body.publishedAt) : null;
    post.publishedAt = requested && !Number.isNaN(requested.getTime()) ? requested : post.publishedAt || new Date();
    post.scheduledAt = null;
  } else {
    post.scheduledAt = null;
  }
  post.status = status;
};

// Copies the editable fields from a request body onto a post document
const applyPostInput = async (post, body, user) => {
  ["title", "excerpt", "coverImageUrl", "coverImageAlt"].forEach((field) => {
    if (body[field] !== undefined) post[field] = String(body[field] ?? "").trim();
  });
  if (body.content !== undefined) post.content = String(body.content ?? "");
  if (body.visibility !== undefined && ["public", "private"].includes(body.visibility)) post.visibility = body.visibility;
  if (body.allowComments !== undefined) post.allowComments = Boolean(body.allowComments);
  if (body.isFeatured !== undefined) post.isFeatured = Boolean(body.isFeatured);

  if (body.categories !== undefined) post.categories = await resolveCategoryIds(body.categories);
  if (body.tags !== undefined) {
    post.tags = cleanTagNames(body.tags);
    await syncTags(post.tags);
  }

  if (body.seo && typeof body.seo === "object") {
    const current = post.seo?.toObject ? post.seo.toObject() : { ...(post.seo || {}) };
    SEO_TEXT_FIELDS.forEach((field) => {
      if (body.seo[field] !== undefined) current[field] = String(body.seo[field] ?? "").trim();
    });
    if (ROBOTS_VALUES.includes(body.seo.robots)) current.robots = body.seo.robots;
    post.seo = current;
  }

  if (post.isNew) {
    post.author = user?._id || null;
    post.authorName = user?.name || "";
  }

  applyStatus(post, body);
  post.wordCount = countWords(post.content);
  post.readingMinutes = readingMinutesFor(post.wordCount);
  post.seo = { ...(post.seo?.toObject ? post.seo.toObject() : post.seo), score: computeSeoScore(post) };
};

// Keeps old URLs working when a published post's slug changes
const redirectOldSlug = async (oldSlug, newSlug, userId) => {
  if (!oldSlug || oldSlug === newSlug) return;
  await SeoRedirectModel.updateOne(
    { from: `/blog/${oldSlug}` },
    { $set: { to: `/blog/${newSlug}`, type: 301, active: true, createdBy: userId } },
    { upsert: true }
  );
};

// Counts non-trashed posts by status for the list tabs
const statusCounts = async () => {
  const rows = await BlogPostModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const counts = { all: 0, published: 0, scheduled: 0, draft: 0, trash: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.count;
    if (row._id !== "trash") counts.all += row.count;
  });
  return counts;
};

// GET /blog/posts
export const listPosts = async (req, res) => {
  try {
    const { status = "all", q = "", category = "", sort = "newest" } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = status === "all" ? { status: { $ne: "trash" } } : { status };
    if (q) filter.title = { $regex: String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (category) {
      const [categoryId] = await resolveCategoryIds([category]);
      filter.categories = categoryId || { $in: [] };
    }

    const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, views: { views: -1 }, title: { title: 1 } };
    const [posts, total, counts] = await Promise.all([
      BlogPostModel.find(filter)
        .select(POST_LIST_FIELDS)
        .populate({ path: "categories", select: "name slug" })
        .sort(sorts[sort] || sorts.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BlogPostModel.countDocuments(filter),
      statusCounts(),
    ]);

    res.json({ status: "success", data: posts.map((post) => ({ ...post, id: String(post._id) })), meta: { total, page, limit, counts } });
  } catch (err) {
    fail(res, err, "Unable to fetch posts");
  }
};

// GET /blog/posts/:id
export const getPost = async (req, res) => {
  try {
    const post = await BlogPostModel.findOne(idOrSlugFilter(req.params.id)).populate({ path: "categories", select: "name slug" });
    if (!post) throw httpError(404, "Post not found");
    res.json({ status: "success", data: post });
  } catch (err) {
    fail(res, err, "Unable to fetch post");
  }
};

// POST /blog/posts
export const createPost = async (req, res) => {
  try {
    const body = req.body || {};
    if (!String(body.title || "").trim()) throw httpError(400, "Title is required");

    const post = new BlogPostModel({ slug: await ensureUniqueSlug(BlogPostModel, body.slug || body.title) });
    post.createdBy = userIdOf(req);
    post.updatedBy = userIdOf(req);
    await applyPostInput(post, body, req.user);
    await post.save();
    res.status(201).json({ status: "success", data: post });
  } catch (err) {
    fail(res, err, "Unable to create post");
  }
};

// PUT /blog/posts/:id
export const updatePost = async (req, res) => {
  try {
    const body = req.body || {};
    const post = await BlogPostModel.findOne(idOrSlugFilter(req.params.id));
    if (!post) throw httpError(404, "Post not found");
    if (body.title !== undefined && !String(body.title).trim()) throw httpError(400, "Title is required");

    const oldSlug = post.slug;
    const wasPublished = post.status === "published";
    if (body.slug !== undefined && slugify(body.slug) && slugify(body.slug) !== post.slug) {
      post.slug = await ensureUniqueSlug(BlogPostModel, body.slug, post._id);
    }
    post.updatedBy = userIdOf(req);
    await applyPostInput(post, body, req.user);
    await post.save();

    if (wasPublished) await redirectOldSlug(oldSlug, post.slug, userIdOf(req));
    res.json({ status: "success", data: post });
  } catch (err) {
    fail(res, err, "Unable to update post");
  }
};

// DELETE /blog/posts/:id (moves to trash first, deletes permanently when already trashed)
export const deletePost = async (req, res) => {
  try {
    const post = await BlogPostModel.findOne(idOrSlugFilter(req.params.id));
    if (!post) throw httpError(404, "Post not found");

    if (post.status === "trash") {
      await Promise.all([post.deleteOne(), BlogCommentModel.deleteMany({ postId: post._id })]);
      return res.json({ status: "success", message: "Post deleted permanently" });
    }
    post.status = "trash";
    post.updatedBy = userIdOf(req);
    await post.save();
    res.json({ status: "success", message: "Post moved to trash", data: post });
  } catch (err) {
    fail(res, err, "Unable to delete post");
  }
};

// POST /blog/posts/bulk
export const bulkPosts = async (req, res) => {
  try {
    const { ids, action } = req.body || {};
    const list = (Array.isArray(ids) ? ids : []).filter(isObjectId);
    if (!list.length) throw httpError(400, "Select at least one post");

    const now = new Date();
    if (action === "trash") await BlogPostModel.updateMany({ _id: { $in: list } }, { $set: { status: "trash", updatedBy: userIdOf(req) } });
    else if (action === "restore") await BlogPostModel.updateMany({ _id: { $in: list }, status: "trash" }, { $set: { status: "draft", updatedBy: userIdOf(req) } });
    else if (action === "publish") {
      await BlogPostModel.updateMany(
        { _id: { $in: list }, status: { $ne: "published" } },
        [{ $set: { status: "published", scheduledAt: null, publishedAt: { $ifNull: ["$publishedAt", now] }, updatedBy: userIdOf(req) } }]
      );
    } else if (action === "delete") {
      await Promise.all([BlogPostModel.deleteMany({ _id: { $in: list }, status: "trash" }), BlogCommentModel.deleteMany({ postId: { $in: list } })]);
    } else throw httpError(400, "Unknown bulk action");

    res.json({ status: "success", message: "Posts updated", data: { count: list.length } });
  } catch (err) {
    fail(res, err, "Unable to update posts");
  }
};

// Counts non-trashed posts per category id
const postCountsByCategory = async () => {
  const rows = await BlogPostModel.aggregate([
    { $match: { status: { $ne: "trash" } } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
};

// GET /blog/categories
export const listCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([BlogCategoryModel.find().sort({ name: 1 }).lean(), postCountsByCategory()]);
    const data = categories.map((category) => ({
      ...category,
      id: String(category._id),
      parent: category.parent ? String(category.parent) : null,
      postCount: counts.get(String(category._id)) || 0,
    }));
    res.json({ status: "success", data });
  } catch (err) {
    fail(res, err, "Unable to fetch categories");
  }
};

// Resolves a parent category reference into an ObjectId or null
const resolveParentId = async (parent, selfId = null) => {
  if (!parent) return null;
  const [parentId] = await resolveCategoryIds([parent]);
  if (!parentId || (selfId && String(parentId) === String(selfId))) return null;
  return parentId;
};

// POST /blog/categories
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, seoTitle, parent } = req.body || {};
    if (!String(name || "").trim()) throw httpError(400, "Name is required");
    if (await BlogCategoryModel.exists({ name: String(name).trim() })) throw httpError(409, "A category with this name already exists");

    const category = await BlogCategoryModel.create({
      name: String(name).trim(),
      slug: await ensureUniqueSlug(BlogCategoryModel, slug || name),
      description: String(description || "").trim(),
      seoTitle: String(seoTitle || "").trim(),
      parent: await resolveParentId(parent),
      createdBy: userIdOf(req),
    });
    res.status(201).json({ status: "success", data: category });
  } catch (err) {
    fail(res, err, "Unable to create category");
  }
};

// PUT /blog/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const category = await BlogCategoryModel.findOne(idOrSlugFilter(req.params.id));
    if (!category) throw httpError(404, "Category not found");
    const { name, slug, description, seoTitle, parent } = req.body || {};

    if (name !== undefined && String(name).trim() && String(name).trim() !== category.name) {
      if (await BlogCategoryModel.exists({ name: String(name).trim(), _id: { $ne: category._id } })) throw httpError(409, "A category with this name already exists");
      category.name = String(name).trim();
    }
    if (slug !== undefined && slugify(slug) && slugify(slug) !== category.slug) category.slug = await ensureUniqueSlug(BlogCategoryModel, slug, category._id);
    if (description !== undefined) category.description = String(description || "").trim();
    if (seoTitle !== undefined) category.seoTitle = String(seoTitle || "").trim();
    if (parent !== undefined) category.parent = await resolveParentId(parent, category._id);
    category.updatedBy = userIdOf(req);

    await category.save();
    res.json({ status: "success", data: category });
  } catch (err) {
    fail(res, err, "Unable to update category");
  }
};

// DELETE /blog/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await BlogCategoryModel.findOne(idOrSlugFilter(req.params.id));
    if (!category) throw httpError(404, "Category not found");

    await Promise.all([
      BlogPostModel.updateMany({ categories: category._id }, { $pull: { categories: category._id } }),
      BlogCategoryModel.updateMany({ parent: category._id }, { $set: { parent: null } }),
      category.deleteOne(),
    ]);
    res.json({ status: "success", message: "Category deleted" });
  } catch (err) {
    fail(res, err, "Unable to delete category");
  }
};

// GET /blog/tags
export const listTags = async (req, res) => {
  try {
    const [tags, counts] = await Promise.all([BlogTagModel.find().sort({ name: 1 }).lean(), countsByTag()]);
    const data = tags
      .map((tag) => ({ ...tag, id: String(tag._id), count: counts.get(tag.name) || 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    res.json({ status: "success", data });
  } catch (err) {
    fail(res, err, "Unable to fetch tags");
  }
};

// POST /blog/tags
export const createTag = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().toLowerCase();
    if (!name) throw httpError(400, "Name is required");
    if (await BlogTagModel.exists({ name })) throw httpError(409, "This tag already exists");

    const tag = await BlogTagModel.create({ name, slug: await ensureUniqueSlug(BlogTagModel, req.body?.slug || name) });
    res.status(201).json({ status: "success", data: tag });
  } catch (err) {
    fail(res, err, "Unable to create tag");
  }
};

// DELETE /blog/tags/:id
export const deleteTag = async (req, res) => {
  try {
    const key = req.params.id;
    const tag = await BlogTagModel.findOne({ $or: [...(isObjectId(key) ? [{ _id: key }] : []), { slug: key }, { name: key }] });
    if (!tag) throw httpError(404, "Tag not found");

    await Promise.all([BlogPostModel.updateMany({ tags: tag.name }, { $pull: { tags: tag.name } }), tag.deleteOne()]);
    res.json({ status: "success", message: "Tag deleted" });
  } catch (err) {
    fail(res, err, "Unable to delete tag");
  }
};

// POST /blog/tags/merge
export const mergeTags = async (req, res) => {
  try {
    const into = String(req.body?.into || "").trim().toLowerCase();
    const from = cleanTagNames(req.body?.from).filter((name) => name !== into);
    if (!into || !from.length) throw httpError(400, "Choose tags to merge and a target name");

    await syncTags([into]);
    await BlogPostModel.updateMany({ tags: { $in: from } }, { $addToSet: { tags: into } });
    await BlogPostModel.updateMany({ tags: { $in: from } }, { $pull: { tags: { $in: from } } });
    await BlogTagModel.deleteMany({ name: { $in: from } });
    res.json({ status: "success", message: "Tags merged", data: { into } });
  } catch (err) {
    fail(res, err, "Unable to merge tags");
  }
};

// GET /blog/comments
export const listComments = async (req, res) => {
  try {
    const status = BLOG_COMMENT_STATUSES.includes(req.query.status) ? req.query.status : "pending";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const [comments, total, countRows] = await Promise.all([
      BlogCommentModel.find({ status }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      BlogCommentModel.countDocuments({ status }),
      BlogCommentModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const counts = Object.fromEntries(BLOG_COMMENT_STATUSES.map((key) => [key, 0]));
    countRows.forEach((row) => {
      counts[row._id] = row.count;
    });

    res.json({
      status: "success",
      data: comments.map((comment) => ({ ...comment, id: String(comment._id), postId: String(comment.postId) })),
      meta: { total, page, limit, counts },
    });
  } catch (err) {
    fail(res, err, "Unable to fetch comments");
  }
};

// PATCH /blog/comments/:id
export const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!BLOG_COMMENT_STATUSES.includes(status)) throw httpError(400, "Invalid comment status");
    if (!isObjectId(req.params.id)) throw httpError(404, "Comment not found");
    const comment = await BlogCommentModel.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!comment) throw httpError(404, "Comment not found");
    res.json({ status: "success", data: comment });
  } catch (err) {
    fail(res, err, "Unable to update comment");
  }
};

// DELETE /blog/comments/:id
export const deleteComment = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) throw httpError(404, "Comment not found");
    const comment = await BlogCommentModel.findByIdAndDelete(req.params.id);
    if (!comment) throw httpError(404, "Comment not found");
    await BlogCommentModel.deleteMany({ parent: comment._id });
    res.json({ status: "success", message: "Comment deleted" });
  } catch (err) {
    fail(res, err, "Unable to delete comment");
  }
};

// POST /blog/comments/:id/reply
export const replyToComment = async (req, res) => {
  try {
    const body = sanitizePlainText(req.body?.body, 2000);
    if (!body) throw httpError(400, "Reply cannot be empty");
    const parent = isObjectId(req.params.id) ? await BlogCommentModel.findById(req.params.id) : null;
    if (!parent) throw httpError(404, "Comment not found");

    const reply = await BlogCommentModel.create({
      postId: parent.postId,
      postTitle: parent.postTitle,
      postSlug: parent.postSlug,
      parent: parent._id,
      authorName: req.user?.name || "Staff",
      authorEmail: req.user?.email || "",
      body,
      status: "approved",
      isStaff: true,
    });
    if (parent.status === "pending") await BlogCommentModel.updateOne({ _id: parent._id }, { $set: { status: "approved" } });
    res.status(201).json({ status: "success", data: reply });
  } catch (err) {
    fail(res, err, "Unable to reply to comment");
  }
};

// GET /blog/overview
export const getOverview = async (req, res) => {
  try {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 13);
    const days = Array.from({ length: 14 }, (_unused, index) => {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + index);
      return dayKey(date);
    });

    const [counts, totals, pendingComments, topPosts, recent, viewRows] = await Promise.all([
      statusCounts(),
      BlogPostModel.aggregate([
        { $match: { status: { $ne: "trash" } } },
        { $group: { _id: null, views: { $sum: "$views" }, readingMinutes: { $avg: "$readingMinutes" } } },
      ]),
      BlogCommentModel.countDocuments({ status: "pending" }),
      BlogPostModel.find({ status: { $ne: "trash" }, views: { $gt: 0 } }).sort({ views: -1 }).limit(4).select("title slug views").lean(),
      BlogPostModel.find({ status: { $ne: "trash" } }).sort({ updatedAt: -1 }).limit(5).select("title status authorName updatedAt").lean(),
      BlogViewDailyModel.find({ day: { $in: days } }).lean(),
    ]);

    const viewMap = new Map(viewRows.map((row) => [row.day, row.count]));
    res.json({
      status: "success",
      data: {
        counts,
        totalViews: totals[0]?.views || 0,
        avgReadingMinutes: Math.round((totals[0]?.readingMinutes || 0) * 10) / 10,
        pendingComments,
        topPosts: topPosts.map((post) => ({ id: String(post._id), title: post.title, slug: post.slug, views: post.views })),
        recent: recent.map((post) => ({ id: String(post._id), title: post.title, status: post.status, authorName: post.authorName, updatedAt: post.updatedAt })),
        dailyViews: days.map((day) => ({ day, count: viewMap.get(day) || 0 })),
      },
    });
  } catch (err) {
    fail(res, err, "Unable to load blog overview");
  }
};

// POST /blog/upload
export const uploadBlogImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ status: "error", message: "No image uploaded" });
  return res.status(201).json({ status: "success", data: { url: req.file.url } });
};
