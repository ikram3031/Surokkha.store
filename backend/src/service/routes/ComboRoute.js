import express from "express";
import { listCombos, getCombo, createCombo, updateCombo, setComboActive, deleteCombo } from "../controllers/ComboController.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

// Group products (combos): fixed pieces sold together with one discount on the whole set
router.get("/", authenticateToken, authorizeRoles(ALL_STAFF), listCombos);
router.post("/", authenticateToken, authorizeRoles(OPERATORS), createCombo);
router.get("/:id", authenticateToken, authorizeRoles(ALL_STAFF), getCombo);
router.put("/:id", authenticateToken, authorizeRoles(OPERATORS), updateCombo);
router.patch("/:id/active", authenticateToken, authorizeRoles(OPERATORS), setComboActive);
router.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteCombo);

export default router;
