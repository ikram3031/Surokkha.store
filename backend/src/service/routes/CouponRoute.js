import express from "express";
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/CouponController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllCoupons);
router.post("/", authenticateToken, authorizeRoles("Owner", "Admin", "Manager"), createCoupon);
router.get("/:id", getCouponById);
router.put("/:id", authenticateToken, authorizeRoles("Owner", "Admin", "Manager"), updateCoupon);
router.delete("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), deleteCoupon);

export default router;
