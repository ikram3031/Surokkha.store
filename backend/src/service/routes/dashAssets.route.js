import { Router } from "express";
import {
  listAssets,
  uploadSlotAsset,
  deleteAsset,
  downloadAsset,
  assetUploadMiddleware,
} from "../controllers/dashAssets.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const dashAssetsRouter = Router();

// Enforce Owner and Admin access only for all assets operations
dashAssetsRouter.use(authenticateToken, authorizeRoles("Owner", "Admin"));

// GET /api/v1/dash/assets - List all assets in /uploads/assets
dashAssetsRouter.get("/", listAssets);

// POST /api/v1/dash/assets/upload-slot - Upload and replace asset in slot (with 2MB limit and WebP conversion)
dashAssetsRouter.post("/upload-slot", assetUploadMiddleware, uploadSlotAsset);

// DELETE /api/v1/dash/assets/:filename - Delete asset from /uploads/assets
dashAssetsRouter.delete("/:filename", deleteAsset);

// GET /api/v1/dash/assets/download/:filename - Download asset file
dashAssetsRouter.get("/download/:filename", downloadAsset);

export default dashAssetsRouter;
