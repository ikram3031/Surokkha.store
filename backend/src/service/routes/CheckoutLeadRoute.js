import { Router } from "express";
import { listCheckoutLeads, getCheckoutLead, convertCheckoutLead, deleteCheckoutLead } from "../controllers/CheckoutLeadController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = Router();

// Dashboard only (Owner, Admin, Manager, Super Admin)
const adminAuth = [authenticateToken, authorizeRoles("Owner", "Admin", "Manager", "Super Admin")];

router.get("/", ...adminAuth, listCheckoutLeads);
router.get("/:id", ...adminAuth, getCheckoutLead);
router.patch("/:id/convert", ...adminAuth, convertCheckoutLead);
router.delete("/:id", ...adminAuth, deleteCheckoutLead);

export default router;
