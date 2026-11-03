import { Router } from "express";
import { listAssets, getAssetById, createAsset, updateAsset, deleteAsset } from "../controllers/AssetsController.js";
import { authenticateToken, authorizeRoles, MARKETERS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const assetsRouter = Router();

assetsRouter.use(authenticateToken);

// Public to authenticated users: list and view
assetsRouter.get("/", authorizeRoles(ALL_STAFF), listAssets);
assetsRouter.get("/:assetId", authorizeRoles(ALL_STAFF), getAssetById);

// Only Owner/Admin can manage assets
assetsRouter.post("/", authorizeRoles(MARKETERS), createAsset);
assetsRouter.put("/:assetId", authorizeRoles(MARKETERS), updateAsset);
assetsRouter.delete("/:assetId", authorizeRoles(MARKETERS), deleteAsset);

export default assetsRouter;
