import { Router } from "express";
import { getPublicCmsContent } from "../../storefront/controllers/CmsContentController.js";

const router = Router();

// GET /store/v1/cms-content?type=section-bg&page=home&site=store : public CMS content for the store frontend
router.get("/", getPublicCmsContent);

export default router;
