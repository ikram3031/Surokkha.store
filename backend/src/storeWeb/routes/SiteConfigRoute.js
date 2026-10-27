import { Router } from "express";
import { getSiteConfig } from "../controllers/SiteConfigController.js";

const router = Router();

router.get("/", getSiteConfig);

export default router;
