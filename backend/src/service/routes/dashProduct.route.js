import { Router } from "express";
import { searchDashProducts } from "../controllers/dashProduct.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const dashProductRouter = Router();

// POST /api/v1/dash/products - High-performance multi-criteria joining search for Dashboard
dashProductRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Marketing-Expert", "Marketing Expert"),
  searchDashProducts
);

export default dashProductRouter;
