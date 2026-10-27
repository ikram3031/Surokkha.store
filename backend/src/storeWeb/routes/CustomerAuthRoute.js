import { Router } from "express";
import {
  authenticateCustomer,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from "../controllers/CustomerAuthController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticateCustomer, me);

export default router;
