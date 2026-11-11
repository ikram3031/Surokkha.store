import express from "express";
import { getPromoSettings, updatePromoSettings } from "../controllers/PromoController.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles(ALL_STAFF), getPromoSettings);
router.put("/", authenticateToken, authorizeRoles(OPERATORS), updatePromoSettings);

export default router;
