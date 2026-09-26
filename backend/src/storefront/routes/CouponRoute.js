import express from "express";
import {
  getAllCoupons,
  getCouponById,
} from "../controllers/CouponController.js";

const router = express.Router();

router.get("/", getAllCoupons);
router.get("/:id", getCouponById);

export default router;
