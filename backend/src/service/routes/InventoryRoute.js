import { Router } from "express";
import {
  listInventory,
  listStockMovements,
  adjustStock,
} from "../controllers/InventoryController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = Router();

const adminAuth = [authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin")];

router.get("/", ...adminAuth, listInventory);
router.get("/movements", ...adminAuth, listStockMovements);
router.post("/adjust", ...adminAuth, adjustStock);

export default router;
