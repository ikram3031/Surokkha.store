import { Router } from "express";
import {
  getStoreUtils,
  updateStoreUtils,
} from "../controllers/StoreUtilsController.js";
import { authenticateToken, authorizeRoles, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const storeUtilsRouter = Router();

// GET /api/v1/store-utils : Public or authenticated retrieval of store showcases
storeUtilsRouter.get("/", getStoreUtils);

// PUT /api/v1/store-utils : Update store showcases (Owner, Admin only)
storeUtilsRouter.put(
  "/",
  authenticateToken,
  authorizeRoles(OPERATORS),
  updateStoreUtils
);

export default storeUtilsRouter;
