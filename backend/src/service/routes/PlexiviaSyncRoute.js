import { Router } from "express";
import {
  getDailyBillSummary,
  getDailyPaymentSummary,
  pingPlexivia,
  requirePlexiviaKey,
  plexiviaStockItems,
  plexiviaApplyReceipt,
  plexiviaCancelReceipt,
  plexiviaGetReceipt,
  asPlexiviaStaff,
} from "../controllers/PlexiviaSyncController.js";
import {
  listStockItems,
  createStockItem,
  updateStockItem,
  adjustStockItem,
  listStockItemMovements,
  listStockReceipts,
} from "../controllers/StockItemController.js";

const plexiviaSyncRouter = Router();

plexiviaSyncRouter.use(requirePlexiviaKey);

plexiviaSyncRouter.get("/ping", pingPlexivia);
plexiviaSyncRouter.get("/daily-bill-summary", getDailyBillSummary);
plexiviaSyncRouter.get("/daily-payment-summary", getDailyPaymentSummary);
plexiviaSyncRouter.get("/stock-items", plexiviaStockItems);
plexiviaSyncRouter.post("/stock-receipts", plexiviaApplyReceipt);
plexiviaSyncRouter.get("/stock-receipts/:ref", plexiviaGetReceipt);
plexiviaSyncRouter.post("/stock-receipts/:ref/cancel", plexiviaCancelReceipt);

// Inventory-only access for Plexivia: the same stock item screens, acting as "Plexivia: <user>"
plexiviaSyncRouter.get("/inventory/items", asPlexiviaStaff, listStockItems);
plexiviaSyncRouter.post("/inventory/items", asPlexiviaStaff, createStockItem);
plexiviaSyncRouter.put("/inventory/items/:id", asPlexiviaStaff, updateStockItem);
plexiviaSyncRouter.post("/inventory/items/:id/adjust", asPlexiviaStaff, adjustStockItem);
plexiviaSyncRouter.get("/inventory/movements", asPlexiviaStaff, listStockItemMovements);
plexiviaSyncRouter.get("/inventory/receipts", asPlexiviaStaff, listStockReceipts);

export default plexiviaSyncRouter;
