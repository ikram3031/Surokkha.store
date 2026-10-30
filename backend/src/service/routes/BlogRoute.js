import express from "express";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";
import { upload } from "../../common/middlewares/upload.middleware.js";
import {
  bulkPosts,
  createCategory,
  createPost,
  createTag,
  deleteCategory,
  deleteComment,
  deletePost,
  deleteTag,
  getOverview,
  getPost,
  listCategories,
  listComments,
  listPosts,
  listTags,
  mergeTags,
  replyToComment,
  updateCategory,
  updateCommentStatus,
  updatePost,
  uploadBlogImage,
} from "../controllers/BlogController.js";
import {
  createKeyword,
  createRedirect,
  deleteKeyword,
  deleteNotFound,
  deleteRedirect,
  getSeoAudit,
  getSeoOverview,
  getSettings,
  getSitemapInfo,
  listKeywords,
  listNotFound,
  listRedirects,
  regenerateSitemap,
  updateKeyword,
  updateRedirect,
  updateSettings,
} from "../controllers/BlogSeoController.js";

const router = express.Router();

router.use(authenticateToken, authorizeRoles("Owner", "Admin", "Marketing Expert"));

router.get("/overview", getOverview);

router.get("/posts", listPosts);
router.post("/posts", createPost);
router.post("/posts/bulk", bulkPosts);
router.get("/posts/:id", getPost);
router.put("/posts/:id", updatePost);
router.delete("/posts/:id", deletePost);

router.post("/upload", upload("image"), uploadBlogImage);

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/tags", listTags);
router.post("/tags", createTag);
router.post("/tags/merge", mergeTags);
router.delete("/tags/:id", deleteTag);

router.get("/comments", listComments);
router.patch("/comments/:id", updateCommentStatus);
router.post("/comments/:id/reply", replyToComment);
router.delete("/comments/:id", deleteComment);

router.get("/seo/overview", getSeoOverview);
router.get("/seo/audit", getSeoAudit);
router.get("/seo/settings", getSettings);
router.put("/seo/settings", updateSettings);
router.get("/seo/sitemap", getSitemapInfo);
router.post("/seo/sitemap/regenerate", regenerateSitemap);
router.get("/seo/keywords", listKeywords);
router.post("/seo/keywords", createKeyword);
router.put("/seo/keywords/:id", updateKeyword);
router.delete("/seo/keywords/:id", deleteKeyword);
router.get("/seo/redirects", listRedirects);
router.post("/seo/redirects", createRedirect);
router.put("/seo/redirects/:id", updateRedirect);
router.delete("/seo/redirects/:id", deleteRedirect);
router.get("/seo/not-found", listNotFound);
router.delete("/seo/not-found/:id", deleteNotFound);

export default router;
