import { Router } from "express";
import { getPublicCmsContent } from "../controllers/CmsContentController.js";

const router = Router();

router.get("/", getPublicCmsContent);

export default router;
