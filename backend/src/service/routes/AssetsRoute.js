import { Router } from "express";
import { listAssets, getAssetById, createAsset, updateAsset, deleteAsset } from "../controllers/AssetsController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const assetsRouter = Router();

assetsRouter.use(authenticateToken);

// Public to authenticated users: list and view
assetsRouter.get("/", listAssets);
assetsRouter.get("/:assetId", getAssetById);

// Only Owner/Admin can manage assets
assetsRouter.post("/", authorizeRoles("Owner", "Admin"), createAsset);
assetsRouter.put("/:assetId", authorizeRoles("Owner", "Admin"), updateAsset);
assetsRouter.delete("/:assetId", authorizeRoles("Owner", "Admin"), deleteAsset);

export default assetsRouter;
