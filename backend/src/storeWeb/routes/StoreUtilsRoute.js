import { Router } from "express";
import { getStoreUtils } from "../controllers/StoreUtilsController.js";
import { getPopularity } from "../../storefront/controllers/PopularityController.js";

const storeUtilsRouter = Router();

// GET /api/v1/store-utils : Public retrieval of store showcases
storeUtilsRouter.get("/", getStoreUtils);

// GET /api/v1/store-utils/popularity : live order count per product, for "most popular" sorting
storeUtilsRouter.get("/popularity", getPopularity);

export default storeUtilsRouter;
