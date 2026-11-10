import { Router } from "express";
import { getCatalogSitemap } from "../controllers/SeoController.js";

const router = Router();

router.get("/sitemap-catalog.xml", getCatalogSitemap);

export default router;
