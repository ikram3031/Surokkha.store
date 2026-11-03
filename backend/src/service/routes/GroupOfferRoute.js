import express from "express";
import {
  getAllGroupOffers,
  getGroupOfferById,
  createGroupOffer,
  updateGroupOffer,
  deleteGroupOffer,
} from "../controllers/GroupOfferController.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles(ALL_STAFF), getAllGroupOffers);
router.post("/", authenticateToken, authorizeRoles(OPERATORS), createGroupOffer);
router.get("/:id", authenticateToken, authorizeRoles(ALL_STAFF), getGroupOfferById);
router.put("/:id", authenticateToken, authorizeRoles(OPERATORS), updateGroupOffer);
router.delete("/:id", authenticateToken, authorizeRoles(OPERATORS), deleteGroupOffer);

export default router;
