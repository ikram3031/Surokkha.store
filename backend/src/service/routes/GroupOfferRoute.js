import express from "express";
import {
  getAllGroupOffers,
  getGroupOfferById,
  createGroupOffer,
  updateGroupOffer,
  deleteGroupOffer,
} from "../controllers/GroupOfferController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllGroupOffers);
router.post("/", authenticateToken, authorizeRoles("Owner", "Admin", "Manager"), createGroupOffer);
router.get("/:id", getGroupOfferById);
router.put("/:id", authenticateToken, authorizeRoles("Owner", "Admin", "Manager"), updateGroupOffer);
router.delete("/:id", authenticateToken, authorizeRoles("Owner", "Admin"), deleteGroupOffer);

export default router;
