import { Router } from "express";
import {
  createCustomerController,
  deleteCustomerController,
  searchCustomersController,
  lookupCustomerController,
  getCustomersListController,
  getCustomerByIdController,
  updateCustomerController,
} from "../controllers/CustomerController.js";
import { authenticateToken, authorizeRoles, ADMINS, MANAGERS, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const customerRouter = Router();

// Search and lookup (available to all dashboard roles)
customerRouter.get("/search", authenticateToken, authorizeRoles(OPERATORS), searchCustomersController);
customerRouter.get("/lookup", authenticateToken, authorizeRoles(OPERATORS), lookupCustomerController);

// Customer CRUD
customerRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(MANAGERS),
  createCustomerController
);

customerRouter.get(
  "/",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getCustomersListController
);

customerRouter.get(
  "/:id",
  authenticateToken,
  authorizeRoles(OPERATORS),
  getCustomerByIdController
);

customerRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(MANAGERS),
  updateCustomerController
);

customerRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(ADMINS),
  deleteCustomerController
);

export default customerRouter;
