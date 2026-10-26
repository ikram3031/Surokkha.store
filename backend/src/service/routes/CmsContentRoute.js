import { Router } from "express";
import {
  cmsImageUpload,
  listCmsContentTypes,
  listCmsContents,
  getCmsContent,
  createCmsContent,
  updateCmsContent,
  deleteCmsContent,
  uploadCmsImage,
} from "../controllers/CmsContentController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateToken, authorizeRoles("Owner", "Admin"));

router.get("/types", listCmsContentTypes);
router.post("/upload", cmsImageUpload, uploadCmsImage);
router.get("/", listCmsContents);
router.post("/", createCmsContent);
router.get("/:id", getCmsContent);
router.put("/:id", updateCmsContent);
router.delete("/:id", deleteCmsContent);

export default router;
