import express from "express";
import {
  getPostBySlug,
  getPublicSeoSettings,
  getRobots,
  getSitemap,
  listCategories,
  listComments,
  listPosts,
  listTags,
  recordView,
  reportNotFound,
  resolveRedirect,
  submitComment,
} from "../controllers/BlogController.js";

const router = express.Router();

router.get("/posts", listPosts);
router.get("/posts/:slug", getPostBySlug);
router.post("/posts/:slug/view", recordView);
router.get("/posts/:slug/comments", listComments);
router.post("/posts/:slug/comments", submitComment);

router.get("/categories", listCategories);
router.get("/tags", listTags);

router.get("/seo/settings", getPublicSeoSettings);
router.get("/seo/redirect", resolveRedirect);
router.post("/seo/404", reportNotFound);
router.get("/sitemap.xml", getSitemap);
router.get("/robots.txt", getRobots);

export default router;
