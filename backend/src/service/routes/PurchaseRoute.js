import { Router } from "express";
import {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  listPurchases,
  getPurchase,
  getPurchaseReceipt,
  createPurchase,
  updatePurchase,
  receivePurchase,
  addPurchasePayment,
  removePurchasePayment,
  cancelPurchase,
} from "../controllers/PurchaseController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

// Stock purchases: every change keeps a "Product Purchase" bill and the stock items in step, so it sits with the bills (Owner/Admin)
const purchaseRouter = Router();

purchaseRouter.use(authenticateToken, authorizeRoles(ADMINS));

purchaseRouter.get("/vendors", listVendors);
purchaseRouter.post("/vendors", createVendor);
purchaseRouter.put("/vendors/:id", updateVendor);
purchaseRouter.delete("/vendors/:id", deleteVendor);

purchaseRouter.get("/", listPurchases);
purchaseRouter.post("/", createPurchase);
purchaseRouter.get("/:id", getPurchase);
purchaseRouter.get("/:id/receipt", getPurchaseReceipt);
purchaseRouter.put("/:id", updatePurchase);
purchaseRouter.post("/:id/receive", receivePurchase);
purchaseRouter.post("/:id/payments", addPurchasePayment);
purchaseRouter.delete("/:id/payments/:paymentId", removePurchasePayment);
purchaseRouter.post("/:id/cancel", alertOwnersOnAdminAction("Cancelled a purchase"), cancelPurchase);

export default purchaseRouter;
