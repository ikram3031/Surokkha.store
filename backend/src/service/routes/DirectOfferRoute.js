import express from "express";
import {
  getAllDirectOffers,
  createDirectOffer,
  updateDirectOffer,
  deleteDirectOffer,
} from "../controllers/DirectOfferController.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles(ALL_STAFF), getAllDirectOffers);
router.post("/", authenticateToken, authorizeRoles(OPERATORS), createDirectOffer);
router.put("/:id", authenticateToken, authorizeRoles(OPERATORS), updateDirectOffer);
router.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteDirectOffer);

export default router;
