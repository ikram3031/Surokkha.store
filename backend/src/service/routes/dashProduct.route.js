import { Router } from "express";
import { searchDashProducts } from "../controllers/dashProduct.controller.js";
import { authenticateToken, authorizeRoles, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const dashProductRouter = Router();

// POST /api/v1/dash/products - High-performance multi-criteria joining search for Dashboard
dashProductRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(ALL_STAFF),
  searchDashProducts
);

export default dashProductRouter;
