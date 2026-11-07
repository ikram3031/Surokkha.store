import { Router } from "express";
import {
  listStockItems,
  createStockItem,
  updateStockItem,
  adjustStockItem,
  listStockItemMovements,
  listStockReceipts,
} from "../controllers/StockItemController.js";
import { authenticateToken, authorizeRoles, MANAGERS } from "../../common/middlewares/auth.middleware.js";

const router = Router();
const staff = [authenticateToken, authorizeRoles(MANAGERS)];

router.get("/", ...staff, listStockItems);
router.post("/", ...staff, createStockItem);
router.get("/movements", ...staff, listStockItemMovements);
router.get("/receipts", ...staff, listStockReceipts);
router.put("/:id", ...staff, updateStockItem);
router.post("/:id/adjust", ...staff, adjustStockItem);

export default router;
