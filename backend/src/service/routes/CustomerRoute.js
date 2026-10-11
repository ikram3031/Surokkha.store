import { Router } from "express";
import {
  searchCustomersController,
  lookupCustomerController,
  getCustomersListController,
  getCustomerByIdController,
  updateCustomerController,
} from "../controllers/CustomerController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const customerRouter = Router();

// Search and lookup (available to all dashboard roles)
customerRouter.get("/search", authenticateToken, searchCustomersController);
customerRouter.get("/lookup", authenticateToken, lookupCustomerController);

// Customer management
customerRouter.get(
  "/",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Marketing-Expert", "Marketing Expert"),
  getCustomersListController
);

customerRouter.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Marketing-Expert", "Marketing Expert"),
  getCustomerByIdController
);

customerRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  updateCustomerController
);

export default customerRouter;
