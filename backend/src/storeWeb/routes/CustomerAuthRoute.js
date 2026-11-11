import { Router } from "express";
import {
  authenticateCustomer,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  verifyEmail,
  resendVerification,
  myPromo,
} from "../controllers/CustomerAuthController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticateCustomer, me);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/promo", authenticateCustomer, myPromo);

export default router;
