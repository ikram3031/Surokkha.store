import { Router } from "express";
import { listAssets, getAssetById } from "../controllers/AssetsController.js";

const assetsRouter = Router();

assetsRouter.get("/", listAssets);
assetsRouter.get("/:assetId", getAssetById);

export default assetsRouter;
