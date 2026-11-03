import express from "express";
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/CouponController.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles(ALL_STAFF), getAllCoupons);
router.post("/", authenticateToken, authorizeRoles(OPERATORS), createCoupon);
router.get("/:id", authenticateToken, authorizeRoles(ALL_STAFF), getCouponById);
router.put("/:id", authenticateToken, authorizeRoles(OPERATORS), updateCoupon);
router.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteCoupon);

export default router;
