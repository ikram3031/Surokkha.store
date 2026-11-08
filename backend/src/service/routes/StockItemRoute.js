import { Router } from "express";
import {
  listStockItems,
  createStockItem,
  updateStockItem,
  adjustStockItem,
  listStockItemMovements,
  undoStockItemMovement,
  listStockReceipts,
} from "../controllers/StockItemController.js";
import { listStockLinks, updateStockLink, deleteStockItem } from "../controllers/StockLinkController.js";
import { authenticateToken, authorizeRoles, MANAGERS } from "../../common/middlewares/auth.middleware.js";

const router = Router();
const staff = [authenticateToken, authorizeRoles(MANAGERS)];

router.get("/", ...staff, listStockItems);
router.post("/", ...staff, createStockItem);
router.get("/movements", ...staff, listStockItemMovements);
router.post("/movements/:movementId/undo", ...staff, undoStockItemMovement);
router.get("/receipts", ...staff, listStockReceipts);
router.get("/catalog", ...staff, listStockLinks);
router.put("/catalog/:entity/:id", ...staff, updateStockLink);
router.put("/:id", ...staff, updateStockItem);
router.post("/:id/adjust", ...staff, adjustStockItem);
router.delete("/:id", ...staff, deleteStockItem);

export default router;
