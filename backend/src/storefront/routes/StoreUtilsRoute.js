import { Router } from "express";
import { getStoreUtils } from "../controllers/StoreUtilsController.js";

const storeUtilsRouter = Router();

// GET /api/v1/store-utils : Public retrieval of store showcases
storeUtilsRouter.get("/", getStoreUtils);

export default storeUtilsRouter;
